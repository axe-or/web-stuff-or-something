
const luaSourceArea = document.querySelector('#lua-source');
const runButton = document.querySelector('#lua-run');
const clearButton = document.querySelector('#lua-clear');
const autorunCheckbox = document.querySelector('#lua-drop-autorun');

let autoRun = autorunCheckbox.checked;

// Init
fengari.load(PRELUDE())();
console.log('Prelude.lua loaded');

runButton.addEventListener('click', () => {
	runLuaSource();
});

autorunCheckbox.addEventListener('change', (ev) => {
	autoRun = autorunCheckbox.checked;
});

function clearLuaSource(){
	luaSourceArea.value = '';
	fengari.load('main = nil')();
}

function runLuaSource(){
	const source =
		`main = nil
		${luaSourceArea.value}
		main()`;
	fengari.load(source)();
}

luaSourceArea.addEventListener('drop', (ev) => {
	ev.preventDefault();
	const text = ev.dataTransfer.getData('text/plain');
	clearLuaSource();
	luaSourceArea.value = text;
	if(autoRun){
		console.clear();
		runLuaSource();
	}
});

clearButton.addEventListener('click', () => {
	console.log(luaSourceArea.value)
	clearLuaSource();
});

function PRELUDE(){
return `
--- Prelude ---
-- Essential lua functions, this is auto included by JS

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
	`
}