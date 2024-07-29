'use strict';

function assert(pred){
	if(!pred){
		throw new Error("Assertion failure");
	}
}

function unimplemented(msg = ""){
	if(msg.length > 0){
		console.error(msg);
	}
	throw new Error("Unimplemented");
}

const min = (a, b) => a < b ? a : b;
const max = (a, b) => a > b ? a : b;
const clamp = (lo, x, hi) => min(max(lo, x), hi);


function initHTMLCursor(cursor){
	document.querySelector('body').fontSize = `${Global.FontHeight}px`; // TODO don't do this
	cursor.style.border = '1px solid white';
	cursor.style.height = Global.FontHeight * 1.85;
	cursor.style.width = Global.FontWidth;
	cursor.style.position = 'absolute';
	return cursor;
}

function getHTMLCursor(){
	let curElement = getHTMLCursor.curElement ??
		(getHTMLCursor = document.querySelector("#cursor"));
	return curElement;
}

function utfEncode(buf, str){
	const encoder = utfEncode.encoder ??
		(utfEncode.encoder = new TextEncoder());
	encoder.encodeInto(str, buf);
}

function getTextWidth(text, font) {
  const canvas = getTextWidth.canvas ??
	(getTextWidth.canvas = document.createElement("canvas"));
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  
  return metrics.width;
}

class Buffer {
	lines = [];
	cursor = {
		line: 0,
		col: 0,
	};
	
	constructor(){}

	moveCursor(dx, dy){
		let l = this.cursor.line;
		const c = this.cursor.col;
		this.cursor.line = clamp(0, l + dy, this.lines.length - 1);
		l = this.cursor.line;
		this.cursor.col = clamp(0, c + dx, this.lines[l].length);
	}
	
	underCursor(cursor = null){
		const cur = cursor ?? this.cursor;
		return this.lines[cur.line][cur.col];
	}

	checkCursor(){
		const lineSize = this.lines[this.cursor.line] ?? -1;
		return this.cursor.col < lineSize;
	}
	
	// Split line under cursor, uses this.cursor by default
	splitLine(cursor = null){
		const cur = cursor ?? this.cursor;
		const line = this.lines[cur.line];
		
		let postCur = line.substring(cur.col, line.length);
		
		this.lines.splice(cur.line+1, 0, postCur)
		console.log(this.lines)
		
		this.lines[cur.line] = this.lines[cur.line].substring(0, cur.col);
	}
	
	insertText(text){
		// TODO: Ensure text doesn't have \n
		if(this.lines.length <= 0){ lines.push(''); }
		
		// TODO: checkCursor()

	}
	
	_insertIntoLine(){
		const cur = this.cursor;
		const line = this.lines[cur.line];
		const head = line.substring(0, cur.col);
		const tail = line.substring(cur.col, line.length);
		this.lines[cur.line] = head + text + tail;
	}
	
	get lineCount(){
		return this.lines.length;
	}
};

function updateLines(buffer, root){
	// TODO: Better system
	let lines = root.querySelectorAll('.editor-line');
	for(let i = 0; i < lines.length; i++){
		root.removeChild(lines[i]);
	}
	
	for(let i = 0; i < buffer.lineCount; i++){
		let el = document.createElement('div');
		el.className = 'editor-line';
		el.style.whiteSpace = 'pre';
		el.style.height = Global.FontHeight * 2;
	
		el.style.padding = 0;
		el.style.margin = 0;
		//el.style.backgroundColor = `hsl(${i * 10 + 120},100%,30%)`;
		
		el.textContent = buffer.lines[i].replaceAll('\t', ' ');
		root.appendChild(el);
	}
}

function updateHTMLCursor(buf, cur){
	const left = Global.FontWidth * (buf.cursor.col);
	const top =  2 * Global.FontHeight * (buf.cursor.line);
	cur.style.left = left + 'pt';
	cur.style.top = top;
}

function initInputHandling(){
	window.addEventListener('keydown', (ev) => {
		if(ev.isPreventedDefault){ return; } // Avoid running event twice.
		//console.log(ev.key);
		
		switch(ev.key){
			case 'ArrowUp':    Global.buffer.moveCursor(0, -1); break;
			case 'ArrowDown':  Global.buffer.moveCursor(0, +1); break;
			case 'ArrowLeft':  Global.buffer.moveCursor(-1, 0); break;
			case 'ArrowRight': Global.buffer.moveCursor(+1, 0); break;
			case 'Enter':
				Global.buffer.splitLine();
				updateLines(Global.buffer, Global.bufElement);
			break;
		}
		updateHTMLCursor(Global.buffer, Global.cursorElement);
		
		// console.log([Global.buffer.cursor, Global.buffer.underCursor()]);
		ev.preventDefault();
	}, true); // Send events directly to listener
}


let Global = {
	buffer: new Buffer(),
	bufElement: document.querySelector('#editor-buffer'),
	cursorElement: document.querySelector('#editor-cursor'),
	FontHeight: 10,
	FontName: 'Consolas',
	FontWidth: 1,
};

/* ---- Main ---- */
Global.buffer.lines.push("int main(){");
Global.buffer.lines.push("  printf(\"Hello\");");
Global.buffer.lines.push("  return 0;");
Global.buffer.lines.push("}");
Global.FontWidth = getTextWidth('A', `regular '${Global.FontName}' ${Global.FontHeight}px`);
initHTMLCursor(Global.cursorElement);
updateLines(Global.buffer, Global.bufElement);
updateHTMLCursor(Global.buffer, Global.cursorElement);

initInputHandling();
