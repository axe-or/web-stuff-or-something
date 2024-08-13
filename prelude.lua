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

function assertf(cond, fmt, ...)
	assert(cond, fmt:format(...))
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

function boolean(x)
	return not not x
end

abs = math.abs

unpack = table.unpack

function make_prototype(proto, init)
	local obj = init or {}
	setmetatable(obj, proto)
	proto.__index = proto
	return obj
end

Queue = {}

function Queue:new(list)
	local q = make_prototype(Queue, {
		items = list or {},
	})
	return q
end

function Queue:__len()
	return #self.items
end

function Queue:__tostring()
	if #self.items == 0 then return '[]' end
	local s = '['
	for _, v in ipairs(self.items) do
		s = s .. tostring(v) .. ' '
	end
	return s:sub(1, #s - 1) .. ']'
end

function Queue:push(element)
	table.insert(self.items, 1, element)
end

function Queue:pop(element)
	local e = self.items[#self.items]
	table.remove(self.items, #self.items)
	return e
end

Stack = {}

function Stack:new(list)
	local q = make_prototype(Stack, {
		items = list or {},
	})
	return q
end

function Stack:__len()
	return #self.items
end

function Stack:__tostring()
	if #self.items == 0 then return '[]' end
	local s = '['
	for _, v in ipairs(self.items) do
		s = s .. tostring(v) .. ' '
	end
	return s:sub(1, #s - 1) .. ']'
end

function Stack:push(element)
	self.items[#self.items+1] = element
end

function Stack:pop(element)
	local e = self.items[#self.items]
	table.remove(self.items, #self.items)
	return e
end

function string.bytes_iter(s)
	local i = 0
	local n = #s

	return function()
		i = i + 1
		if i > n then
			return nil
		end
		return s:byte(i)
	end
end

function fnv32a(data, basis)
	assert(type(data) == 'string')
	local FNV32_OFFSET_BASIS = 0x811c9dc5
	local FNV32_PRIME = 0x01000193

	local hash = basis or FNV32_OFFSET_BASIS

	for b in data:bytes_iter() do
		hash = hash * FNV32_PRIME
		hash = hash ~ b
	end

	return hash
end

local Test = {}

function Test:new(title)
	local t = make_prototype(Test, {
		failed = 0,
		total = 0,
		title = title,
	})
	return t
end

function Test:expect(pred, msg)
	self.total = self.total + 1
	msg = msg or 'Failed expect()'
	if not pred then
		local info = debug.getinfo(1, 'Sl')
		printf('[Fail %s %s:%d] %s',
			self.title, info.source, info.currentline, msg)
		self.failed = self.failed + 1
	end
	return boolean(pred)
end

function Test:report()
	printf('[%s] %s ok in %d/%d',
		self.title,
		self.failed == 0 and 'PASS' or 'FAIL',
		self.total - self.failed,
		self.total)
end

function test(title, fn)
	local t = Test:new(title)
	fn(t)
	t:report()
	return t.failed == 0
end
