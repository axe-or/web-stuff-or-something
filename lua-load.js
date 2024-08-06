
const luaSourceArea = document.querySelector('#lua-source');
const runButton = document.querySelector('#lua-run');
const clearButton = document.querySelector('#lua-clear');
const autorunCheckbox = document.querySelector('#lua-drop-autorun');

let autoRun = autorunCheckbox.checked;

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

