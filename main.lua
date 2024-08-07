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
	
	If = 'if',
	Else = 'else',
	For = 'for',
	Fn = 'fn',
	Let = 'let',
	
	Identifier = 1,
	Number = 2,
	String = 3,
	Boolean = 4,
}

function main()
	for k, v in pairs(TokenKind) do
		printf('%s: %s', k, v)
	end
end
