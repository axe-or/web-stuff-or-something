local function list_string(l)
	if #l == 0 then return '[]' end
	local s = '['
	for _, v in ipairs(l) do
		if type(v) == 'table' then
			s = s .. list_string(v) .. ' '
		else
			s = s .. tostring(v) .. ' '
		end
	end
	return s:sub(1, #s-1) .. ']'
end

local TokenKind = enum {
	Paren_Open = '(',
	Paren_Close = ')',
	Square_Open = '[',
	Square_Close = ']',
	Curly_Open = '{',
	Curly_Close = '}',

	Dot = '.',
	Comma = ',',
	Colon = ':',
	Semicolon = ';',

	Plus = '+',
	Minus = '-',
	Star = '*',
	Slash = '/',
	Modulo = '%',

	Greater = '>',
	Less = '<',
	Greater_Equal = '>=',
	Less_Equal = '<=',
	Not_Equal = '!=',
	Equal_Equal = '==',

	Equal = '=',

	If = 'if',
	Else = 'else',
	For = 'for',
	Fn = 'fn',
	Let = 'let',

	Identifier = 1,
	Integer = 2,
	Real = 3,
	String = 4,
	Boolean = 5,

	EOF = -1,
	Unknown = -2,
}

local Token = {}

-- Tokens that are unambigously one char
local TOKENS_1 = readonly {
	['('] = TokenKind.Paren_Open,
	[')'] = TokenKind.Paren_Close,
	['['] = TokenKind.Square_Open,
	[']'] = TokenKind.Square_Close,
	['{'] = TokenKind.Curly_Open,
	['}'] = TokenKind.Curly_Close,

	['.'] = TokenKind.Dot,
	[','] = TokenKind.Comma,
	[':'] = TokenKind.Colon,
	[';'] = TokenKind.Semicolon,

	['+'] = TokenKind.Plus,
	['-'] = TokenKind.Minus,
	['*'] = TokenKind.Star,
	['/'] = TokenKind.Slash,
	['%'] = TokenKind.Modulo,
}

-- Tokens that are unambigously 2 chars or less
local TOKENS_2 = readonly {
	['>'] = TokenKind.Greater,
	['<'] = TokenKind.Less,
	['>='] = TokenKind.Greater_Equal,
	['<='] = TokenKind.Less_Equal,
	['=='] = TokenKind.Equal_Equal,
	['='] = TokenKind.Equal,
	['!='] = TokenKind.Not_Equal,
	['!'] = TokenKind.Unknown, -- Lone ! is not allowed
}

function Token:new(kind, lexeme, payload)
	local tk = make_prototype(self, {
		kind    = kind or TokenKind.Unknown,
		lexeme  = lexeme or '',
		payload = payload,
	})
	return tk
end

function Token:__tostring()
	if type(self.kind) == 'string' then
		return self.kind
	else
		if self.kind == TokenKind.Identifier then
			return sprintf('Id(%s)', self.lexeme)
		elseif self.kind == TokenKind.Integer or self.kind == TokenKind.Real then
			return sprintf('Num(%s)', self.payload)
		elseif self.kind == TokenKind.Boolean then
			return sprintf('%s', self.payload)
		elseif self.kind == TokenKind.String then
			return sprintf('String(%s)', self.payload)
		elseif self.kind == TokenKind.Unknown then
			return sprintf('<Unknown: %s>', self.lexeme)
		else
			unimplemented()
		end
	end
end

local ASCII_UPPER   = {utf8.codepoint('AZ', 1, 2)}
local ASCII_LOWER   = {utf8.codepoint('az', 1, 2)}
local ASCII_NUMERIC = {utf8.codepoint('09', 1, 2)}

function is_alpha(c)
	local point = utf8.codepoint(c, 1, 1)
	local uppercase = point >= ASCII_UPPER[1] and point <= ASCII_UPPER[2]
	local lowercase = point >= ASCII_LOWER[1] and point <= ASCII_LOWER[2]
	return uppercase or lowercase
end

function is_numeric(c)
	local point = utf8.codepoint(c, 1, 1)
	return point >= ASCII_NUMERIC[1] and point <= ASCII_NUMERIC[2]
end

function is_whitespace(c)
	return c == ' ' or c == '\n' or
		   c == '\r' or c == '\t'
end

function is_identifier(c)
	return c == '_' or is_alpha(c) or is_numeric(c)
end

function is_binary(c)
	local x = c:find('[01]')
	return boolean(x)
end

function is_hexadecimal(c)
	local x = c:find('[0-9a-fA-F]')
	return boolean(x)
end

function is_octal(c)
	local x = c:find('[0-7]')
	return boolean(x)
end

local Lexer = {}

function Lexer:new(src)
	local lex = make_prototype(Lexer, {
		current = 1,
		previous = 1,
		source = src or '',
	})
	return lex
end

function Lexer:advance()
	if self.current > #self.source then
		return nil
	end
	local i = self.current
	self.current = i + 1
	return self.source:sub(i, i)
end

function Lexer:advance_matching(char, ...)
	local cur = self:peek(0)
	if cur == char then
		return self:advance()
	end
	local rest = {...}
	for _, val in ipairs(rest) do
		if cur == val then
			return self:advance()
		end
	end

	return nil
end

function Lexer:current_lexeme()
	return self.source:sub(self.previous, self.current - 1)
end

function Lexer:peek(n)
	if self.current + n > #self.source then
		return nil
	end
	local i = self.current + n
	return self.source:sub(i, i)
end

function Lexer:tokenize_non_decimal(base)
	local digits = ''
	
	local digit_fn = 0
	if base == 2 then
		digit_fn = is_binary
	elseif base == 8 then
		digit_fn = is_octal
	elseif base == 16 then
		digit_fn = is_hexadecimal
	else
		errorf('Unknown base: %d', base)
	end

	print('BASE', base)
	while true do
		local c = self:advance()

		if c == '_' then
			-- Ignore
		elseif digit_fn(c) then
			digits = digits .. c
		elseif not is_whitespace(c) then
			errorf('Digit "%s" cannot appear in a base-%d number.', c, base)
		else
			self.current = self.current - 1
			break
		end
	end
	
	-- TODO: Handle overflows
	local num = tonumber(digits, base)
	local tk = Token:new(TokenKind.Integer, self:current_lexeme(), num)
	return tk
end

function Lexer:tokenize_number()
	self.previous = self.current
	local BASES = {
		['0b'] = 2,
		['0o'] = 8,
		['0x'] = 16,
	}
	
	local first = self:peek(0)
	local second = self:peek(1)

	if is_alpha(second) then
		self.current = self.current + 2 -- Discard prefix
		local prefix = first .. second
		local base = BASES[prefix]
		assertf(base, 'Invalid base: %s', prefix)
		return self:tokenize_non_decimal(base)
	else
		unimplemented()
	end

	return Token:new(TokenKind.Number, '', -69)
end

function Lexer:next()
	local c = 0
	repeat
		c = self:advance()
	until not is_whitespace(c)

	if not c then return nil end

	local kind = TokenKind.Unknown

	kind = TOKENS_1[c]
	if kind then
		return Token:new(kind)
	end

	kind = TOKENS_2[c]
	if kind then
		c = c .. self:peek(0)
		local kind2 = TOKENS_2[c]
		if kind2 then
			self:advance()
			return Token:new(kind2)
		else
			return Token:new(kind)
		end
	end

	if is_numeric(c) then
		self.current = self.current - 1
		return self:tokenize_number()
	end

	if is_alpha(c) or c == '_' then
		self.current = self.current - 1
		return self:tokenize_identifier()
	end

	return Token:new()
end

function Lexer:tokenize_identifier()
	self.previous = self.current

	while true do
		local c = self:advance()
		if not is_identifier(c) then
			self.current = self.current - 1
			break
		end
	end

	local lexeme = self:current_lexeme()

	return Token:new(TokenKind.Identifier, lexeme)
end

function main()
	local lex = Lexer:new('a39 = 0o77 91  <= - x + _in.sit 8 != 3 +--;>   ')
	print(is_hexadecimal('F'))
	print(tonumber('1e+21') / 23452)
	while true do
		local tk = lex:next()
		if not tk then break end

		print(tk)
	end
end

