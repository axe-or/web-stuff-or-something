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
	Dot_Dot = '..',
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
	Arrow = '->',

	If = 'if',
	Else = 'else',
	For = 'for',
	Proc = 'proc',
	In = 'in',
	Let = 'let',
	Return = 'return',
	Break = 'break',
	Continue = 'continue',

	And = '&',
	Or = '|',
	Xor = '~',
	Shift_Left = '<<',
	Shift_Right = '>>',

	Logic_And = '&&',
	Logic_Or = '||',
	Logic_Not = '!',

	Identifier = 1,
	Integer = 2,
	Real = 3,
	String = 4,
	Boolean = 5,

	EOF = -1,
	Unknown = -2,
}

local KEYWORDS = {
	['if'] = TokenKind.If,
	['else'] = TokenKind.Else,
	['for'] = TokenKind.For,
	['proc'] = TokenKind.Proc,
	['let'] = TokenKind.Let,
	['in'] = TokenKind.In,
	['return'] = TokenKind.Return,
	['break'] = TokenKind.Break,
	['continue'] = TokenKind.Continue,
	['true'] = TokenKind.Boolean,
	['false'] = TokenKind.Boolean,
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

	[','] = TokenKind.Comma,
	[':'] = TokenKind.Colon,
	[';'] = TokenKind.Semicolon,

	['+'] = TokenKind.Plus,
	['*'] = TokenKind.Star,
	['/'] = TokenKind.Slash,
	['%'] = TokenKind.Modulo,
}

-- Tokens that are unambigously 2 chars or less
local TOKENS_2 = readonly {
	['.'] = TokenKind.Dot,
	['..'] = TokenKind.Dot_Dot,

	['-'] = TokenKind.Minus,
	['->'] = TokenKind.Arrow,

	['>'] = TokenKind.Greater,
	['<'] = TokenKind.Less,
	['>='] = TokenKind.Greater_Equal,
	['<='] = TokenKind.Less_Equal,
	['=='] = TokenKind.Equal_Equal,
	['='] = TokenKind.Equal,

	['!'] = TokenKind.Logic_Not,
	['!='] = TokenKind.Not_Equal,

	['&'] = TokenKind.And,
	['|'] = TokenKind.Or,
	['~'] = TokenKind.Xor,
	['<<'] = TokenKind.Shift_Left,
	['>>'] = TokenKind.Shift_Right,

	['&&'] = TokenKind.Logic_And,
	['||'] = TokenKind.Logic_Or,
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
		elseif self.kind == TokenKind.Integer then
			return sprintf('Int(%s)', self.payload)
		elseif self.kind == TokenKind.Real then
			return sprintf('Real(%s)', self.payload)
		elseif self.kind == TokenKind.Boolean then
			return sprintf('%s', self.payload)
		elseif self.kind == TokenKind.String then
			return sprintf('String(%s)', self.payload)
		elseif self.kind == TokenKind.Boolean then
			return sprintf('%s', self.payload)
		elseif self.kind == TokenKind.Unknown then
			return sprintf('<Unknown: %s>', self.lexeme)
		else
			unimplemented()
		end
	end
end

local ASCII_UPPER = {utf8.codepoint('AZ', 1, 2)}
local ASCII_LOWER = {utf8.codepoint('az', 1, 2)}

function is_alpha(c)
	if not c then return false end
	local point = utf8.codepoint(c, 1, 1)
	local uppercase = point >= ASCII_UPPER[1] and point <= ASCII_UPPER[2]
	local lowercase = point >= ASCII_LOWER[1] and point <= ASCII_LOWER[2]
	return uppercase or lowercase
end

function is_numeric(c)
	local x = c:find('[0-9]')
	return boolean(x)
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
	assert(type(src) == 'string', 'No source for lexer')
	local lex = make_prototype(Lexer, {
		current = 1,
		previous = 1,
		source = src,
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

	while true do
		local c = self:advance()
		if not c then break end

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

function Lexer:tokenize_decimal()
	local digits = ''
	local is_float = false
	local has_exponent = false

	while true do
		local c = self:advance()
		if not c then break end
		if c == '_' then
			-- Ignore
		elseif c == '.' and not is_float then
			digits = digits .. c
			is_float = true
			local d = self:advance()
			if not (d and is_numeric(d)) then
				errorf('Expected a digit to follow decimal place')
			end
			digits = digits .. d
		elseif c == 'e' and not has_exponent then
			has_exponent = true
			is_float = true
			digits = digits .. 'e' .. (self:advance_matching('+', '-') or '')
		elseif is_numeric(c) then
			digits = digits .. c
		else
			self.current = self.current - 1
			break
		end
	end

	local payload = tonumber(digits)
	assert(payload, digits)
	local tk = Token:new(
		is_float and TokenKind.Real or TokenKind.Integer,
		self:current_lexeme(),
		payload)

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

	if is_alpha(second) and first == '0' then
		self.current = self.current + 2 -- Discard prefix
		local prefix = first .. second
		local base = BASES[prefix]
		assertf(base, 'Invalid base: %s', prefix)
		return self:tokenize_non_decimal(base)
	else
		return self:tokenize_decimal(base)
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
		c = c .. (self:peek(0) or '')
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

	errorf('Unrecognized character: %s', c)
end

function Lexer:tokenize_identifier()
	self.previous = self.current

	while true do
		local c = self:advance()
		if not c then break end

		if not is_identifier(c) then
			self.current = self.current - 1
			break
		end
	end

	local lexeme = self:current_lexeme()
	local kw = KEYWORDS[lexeme]

	local tk = Token:new(kw or TokenKind.Identifier, lexeme)
	if lexeme == 'true' then
		tk.payload = true
	elseif lexeme == 'false' then
		tk.payload = false
	end
	return tk
end

function tokenize(src)
	local lex = Lexer:new(src)
	local tokens = {}

	while true do
		local tk = lex:next()
		if not tk then break end
		append(tokens, tk)
	end

	return tokens
end

local Expression = {}

local ExprKind = enum {
	Primary = 0,
	Unary = 1,
	Binary = 2,
	Group = 3,
	Indexing = 4,
	Call = 5,
}

function Expression:new_primary(tk)
	assert(getmetatable(tk) == Token, 'Primary expression must be built from token')
	local e = make_prototype(Expression, {
		kind = ExprKind.Primary,
		token = tk,
	})
	return e
end

function Expression:new_unary(op, operand)
	assert(getmetatable(operand) == Expression, 'Expression sides must be expressions')
	assert(getmetatable(op) == Token, 'Operator must be a token')
	local e = make_prototype(Expression, {
		kind = ExprKind.Unary,
		operator = op,
		operand = operand,
	})
	return e
end

function Expression:new_binary(l, op, r)
	assert(getmetatable(l) == Expression and getmetatable(r) == Expression, 'Expression sides must be expressions')
	if (getmetatable(op) ~= Token) then error('Operator must be a token', 2) end
	local e = make_prototype(Expression, {
		kind = ExprKind.Binary,
		left = l,
		right = r,
		operator = op,
	})
	return e
end

function Expression:new_group(exp)
	assert(getmetatable(exp) == Expression, 'Subexpr but must be an expression')
	local e = make_prototype(Expression, {
		kind = ExprKind.Group,
		inner = exp,
	})
	return e
end

function Expression:new_indexing(obj, idx)
	assert(getmetatable(obj) == Expression and getmetatable(idx) == Expression,
		'Index and Object need to be expressions')
	local e = make_prototype(Expression, {
		kind = ExprKind.Indexing,
		object = obj,
		index = idx,
	})
	return e
end

function Expression:__tostring()
	if self.kind == ExprKind.Primary then
		if self.token.kind == TokenKind.Identifier then
			return self.token.lexeme
		else
			return tostring(self.token.payload)
		end
	elseif self.kind == ExprKind.Unary then
		return sprintf('(%s %s)', self.operator, self.operand)
	elseif self.kind == ExprKind.Binary then
		return sprintf('(%s %s %s)', self.operator, self.left, self.right)
	elseif self.kind == ExprKind.Indexing then
		return sprintf('([] %s %s)', self.object, self.index)
	else
		error('Invalid expression')
	end
end


local function left_assoc(prec)
	return {prec, prec+1}
end

local function right_assoc(prec)
	return {prec+1, prec}
end

local PREFIX_OPERATORS = {
	[TokenKind.Plus] = 1000,
	[TokenKind.Minus] = 1000,
	[TokenKind.Xor] = 1000,
	[TokenKind.Logic_Not] = 1000,
}

local POSTFIX_OPERATORS = {
	[TokenKind.Square_Open] = 1200,
}

local INFIX_OPERATORS = {
	[TokenKind.Plus] = left_assoc(500),
	[TokenKind.Minus] = left_assoc(500),
	[TokenKind.Star] = left_assoc(600),
	[TokenKind.Slash] = left_assoc(600),
	
	[TokenKind.Or] = left_assoc(500),
	[TokenKind.Xor] = left_assoc(500),
	[TokenKind.And] = left_assoc(600),
	[TokenKind.Shift_Left] = left_assoc(600),
	[TokenKind.Shift_Right] = left_assoc(600),
	
	[TokenKind.Equal_Equal] = left_assoc(400),
	[TokenKind.Not_Equal] = left_assoc(400),
	[TokenKind.Greater_Equal] = left_assoc(400),
	[TokenKind.Less_Equal] = left_assoc(400),
	[TokenKind.Greater] = left_assoc(400),
	[TokenKind.Less] = left_assoc(400),
	
	[TokenKind.Logic_And] = left_assoc(350),
	[TokenKind.Logic_Or] = left_assoc(300),
	
	[TokenKind.Dot_Dot] = left_assoc(200),
}

local function infix_binding_power(op)
	local p = INFIX_OPERATORS[op] or {}
	return p[1], p[2]
end

local function prefix_binding_power(op)
	local r = PREFIX_OPERATORS[op]
	return nil, r
end

local function postfix_binding_power(op)
	local l = POSTFIX_OPERATORS[op]
	return l, nil
end

local Parser = {}

function Parser:new(tokens)
	assert(tokens, 'Parser requires a list of tokens')
	local p = make_prototype(Parser, {
		current = 1,
		tokens = tokens,
	})
	return p
end

function Parser:advance()
	if self.current > #self.tokens then
		return nil
	end
	self.current = self.current + 1
	return self.tokens[self.current - 1]
end

function Parser:advance_expected(kind)
	local tk = self:advance()
	if not tk or tk.kind ~= kind then
		errorf('Expected %s', kind)
	end
	return tk
end

function Parser:peek(n)
	if self.current + n > #self.tokens then
		return nil
	end
	local i = self.current + n
	return self.tokens[i]
end

function is_primary_token(tk)
	return tk.kind == TokenKind.Integer
		or tk.kind == TokenKind.Real
		or tk.kind == TokenKind.String
		or tk.kind == TokenKind.Identifier
		or tk.kind == TokenKind.Boolean
end

function is_operator_token(tk)
	return not is_primary_token(tk)
		   and tk.kind ~= TokenKind.Unknown
		   and tk.kind ~= TokenKind.EOF
end

function Parser:parse_expression()
	return self:parse_expression2(0)
end

function Parser:parse_expression2(min_bp)
	if not (min_bp) then error('A minimum binding power is required', 2) end
	local left = false
	local tk = self:advance()
	
	if not tk then
		error('Expected a token')
	elseif is_primary_token(tk) then
		left = Expression:new_primary(tk)
	elseif tk.kind == TokenKind.Paren_Open then
		left = self:parse_expression2(0)
		self:advance_expected(TokenKind.Paren_Close)
	elseif is_operator_token(tk) then
		local _, rp = prefix_binding_power(tk.kind)
		if not rp then
			error('Not a prefix operator')
		end
		local right = self:parse_expression2(rp)
		left = Expression:new_unary(tk, right)
	else
		error('Unexpected')
	end

	::parse_loop:: while true do
		local lp, rp = false, false
		local op = false
		
		local lookahead = self:peek(0)
		if not lookahead then
			break
		else
			op = lookahead.kind
		end
		
		lp, _ = postfix_binding_power(op)
		if lp then
			if lp < min_bp then break end
			self:advance()
			
			if op == TokenKind.Square_Open then
				local index = self:parse_expression2(0)
				self:advance_expected(TokenKind.Square_Close)
				left = Expression:new_indexing(left, index)
			else
				left = Expression:new_unary(lookahead, left)
			end

			goto parse_loop
		end
		
		lp, rp = infix_binding_power(op)
		if lp and rp then
			if lp < min_bp then break end

			self:advance()
			local right = self:parse_expression2(rp)
			left = Expression:new_binary(left, lookahead, right)
			goto parse_loop
		end
		
		break -- End parsing
	end
	
	if not left then error('Left expr is nil') end
	return left
end

function main()
	local src = '4 + 23.5 / (-10 - x[i+1])'
	local tokens = tokenize(src)
	local p = Parser:new(tokens)
	local e = p:parse_expression()
	print(e)
end

test('Lexer', function(t)
	local fmt_tokens = function (toks)
		return table.concat(map(tostring, toks), ' ')
	end
	do
		local src = '+-*/%&&&|||~...:;,= ==!=>=<=>>><<<'
		local tokens = tokenize(src)
		local res = fmt_tokens(tokens)
		t:expect(res == '+ - * / % && & || | ~ .. . : ; , = == != >= <= >> > << <')
	end

	do
		local src = '0xff_d0 0o10 0b1_1_11 6.9e-5 1e+3'
		local tokens = tokenize(src)
		local res = fmt_tokens(tokens)
		t:expect(res == sprintf('Int(%d) Int(8) Int(15) Real(0.000069) Real(1000.0)',
			0xffd0))
	end

	do
		local src = 'let if for x in list else proc true false'
		local tokens = tokenize(src)
		local res = fmt_tokens(tokens)
		t:expect(res == 'let if for Id(x) in Id(list) else proc true false')
	end
end)