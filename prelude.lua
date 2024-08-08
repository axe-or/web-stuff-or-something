--- Prelude ---
-- Essential lua functions, this is auto included by JS

function min(a, b)
	if a < b then
		return a;
	else
		return b;
	end
end

function max(a, b)
	if a > b then
		return a;
	else
		return b;
	end
end

function clamp(lo, x, hi)
	return min(max(lo, x), hi)
end

function or_else(val, alt)
	if val == nil then
		return val
	end
end

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
	assert(type(list) == 'table', 'Type error')
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

function errorf(fmt, ...)
	error(fmt:format(...))
end

function printf(fmt, ...)
	print(fmt:format(...))
end

function sprintf(fmt, ...)
	return fmt:format(...)
end

function unimplemented(msg)
	error(sprintf('Unimplemented code %s', msg or ''))
end

function readonly(tbl)
	local proxy = {
		__readonly = true,
	}
	local mt = {
		__index = tbl,
		__newindex = function(t, k, v)
			error('Cannot change readonly table')
		end,
		__pairs = function()
			return pairs(tbl)
		end
	}
	setmetatable(proxy, mt)
	return proxy
end

function enum(tbl)
	local proxy = {}
	local mt = {
		__index = function(t, k)
			if tbl[k] == nil then
				errorf('Value %s is not part of enum', k)
			else
				return tbl[k]
			end
		end,
		__newindex = function(t, k, v)
			error('Enums do not support addition of new values')
		end,
		__pairs = function(t)
			return pairs(tbl)
		end,
	}
	setmetatable(proxy, mt)
	return proxy
end

abs = math.abs

unpack = table.unpack
