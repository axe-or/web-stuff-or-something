
const luaSourceArea = document.querySelector('#lua-source');
const runButton = document.querySelector('#lua-run');
const clearButton = document.querySelector('#lua-clear');

runButton.addEventListener('click', () => {
	const source =
		`main = nil
		${luaSourceArea.value}
		main()`;
	fengari.load(source)();
})

function clearLuaSource(){
	luaSourceArea.value = '';
	fengari.load('main = nil')();
}

luaSourceArea.addEventListener('drop', (ev) => {
	ev.preventDefault();
	const text = ev.dataTransfer.getData('text/plain');
	clearLuaSource();
	luaSourceArea.value = text;
});

clearButton.addEventListener('click', () => {
	console.log(luaSourceArea.value)
	clearLuaSource();
})

