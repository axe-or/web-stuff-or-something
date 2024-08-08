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
	Number = 2,
	String = 3,
	Boolean = 4,
	
	EOF = -1,
	Unknown = -2,
}

function make_prototype(proto, init)
	local obj = init or {}
	setmetatable(obj, proto)
	proto.__index = proto
	return obj
end

local Token = {}

function Token:new(kind, lexeme)
	local tk = make_prototype(self, {
		kind    = kind or TokenKind.Unknown,
		lexeme  = lexeme or '',
		payload = nil,
	})
	return tk
end

function Token:__tostring()
	if type(self.kind) == 'string' then
		return self.kind
	else
		if self.kind == TokenKind.Identifier then
			return sprintf('Id(%s)', self.lexeme)
		elseif self.kind == TokenKind.Number then
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

function Lexer:peek(n)
	if self.current + n > #self.source then
		return nil
	end
	local i = self.current + n
	return self.source:sub(i, i)
end

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

function Lexer:next()
	local c = self:advance()
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
	
	return Token:new()
end

function main()
	local lex = Lexer:new('x = 123 <= 8 != 3;')
	unpack(lex)
	while true do
		local tk = lex:next()
		if not tk then break end
		print(tk)
	end
end

