function list_string(l)
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

function main()
	local list = {4, 2, 0, 6, 9}
	local a = head(#list, list)
	print(list_string(a))
	print(reduce(function(x,y) return  x+ y end, a, 0))
end