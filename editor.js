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

let FontHeight = 10;
let FontWidth = null; // Must be computed with canvas
let FontName = 'Consolas';

function initCursor(){
	let cursor = document.querySelector("#cursor");
	document.querySelector('body').fontSize = `${FontHeight}px`; // TODO don't do this
	cursor.style.border = '1px solid white';
	cursor.style.height = FontHeight + 6;
	cursor.style.width = FontWidth + 1;
	cursor.style.position = 'absolute';
	return cursor;
}

function getHTMLCursor(){
	let curElement = getHTMLCursor.curElement ??
		(getHTMLCursor = document.querySelector("#cursor"));
	return curElement;
}

function updateHTMLCursor(buffer){

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


FontWidth = getTextWidth('A', `${FontName} ${FontHeight}px`);
initCursor();

let buf = new Buffer();
buf.lines.push("int main(){");
buf.lines.push("	printf(\"Hello\");");
buf.lines.push("	return 0");
buf.lines.push("}");

//buf.splitLine({line: 0, col: 4});
//buf.splitLine({line: 1, col: 6});

const P = (x) => { console.log(x); return x; }
const delay = n => new Promise(r => setTimeout(r, n));

const bufEl = document.querySelector('#editor-buffer');

let cur = getHTMLCursor();
// cur.style.left = getTextWidth(buf.lines[0], `${FontName} ${FontHeight}pt`);

for(let i = 0; i < buf.lineCount; i++){
	console.log(buf.lines[i]);
	let el = document.createElement('div');
	el.style.whiteSpace = 'pre';
	el.textContent = buf.lines[i].replaceAll('\t', '    ');
	bufEl.appendChild(el);
}
cur.style.top = FontHeight + 'px';

let _ = (async () => {
	for(let i = 0; i <7; i += 1){
		const left = (FontWidth * (buf.cursor.col + 1));
		cur.style.left = left + 'pt';
		buf.cursor.col += 1;
		await delay(500);
	}
})();




/*
	window.addEventListener('keydown', (ev) => {
		if(ev.isPreventedDefault){ return; } // Avoid running event twice.
		console.log(ev.key)
		
		if(buf.mode === EditorMode.Normal){
			buf.inputBuf += ev.key;
		}
		else if(buf.mode == EditorMode.Insert){
			switch(ev.key){
				case 'Escape': {
					buf.mode = EditorMode.Normal;
					updateModeIndicator(buf.mode);
				} break;
			}
		}
		else if(buf.mode == EditorMode.Select){
			unimplemented();
		}
		else {
			throw Exception("Unkown Mode");
		}
		
		ev.preventDefault();
	}, true); // Send events directly to listener

main()
*/
