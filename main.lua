function map(fn, list)
	assert(type(list) == 'table', 'Type error')
	local arr = {}
	for i, v in ipairs(list) do
		arr[i] = fn(v)
	end
	return arr
end

function filter(fn, list)
	assert(type(list) == 'table', 'Type error')
	local res = {}
	for i, v in ipairs(list) do
		if fn(v) then
			append(res, v)
		end
	end
	return res
end

function reduce(fn, list, init)
	local res = init
	for _, v in ipairs(list) do
		res = fn(res, v)
	end
	return res
end 

function head(n, list)
	assert(type(n) == 'number', 'Type error')
	local res = {}
	for i, v in ipairs(list) do
		if i > n then
			break
		end
		res[i] = v
	end
	return res
end

function tail(n, list)
	assert(type(n) == 'number', 'Type error')
	local res = {}
	local seen = 0
	for i = 1, #list + 1, 1 do
		local pos = #list + 1 - i
		seen = seen + 1
		if seen > n then
			break
		end
		res[pos] = list[pos]
	end
	return res
end

function append(list, e)
	assert(type(list) == 'table', 'Type error')
	list[#list + 1] = e
end

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
	-- for i = 0, #list, 1 do
		-- print(list_string(tail(i, list)))
	-- end
	local a = head(#list, list)
	print(list_string(a))
	print(reduce(function(x,y) return  x+ y end, a, 0))
end