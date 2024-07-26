
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

let FontHeight = 11;

function initCursor(){
	let cursor = document.querySelector("#cursor");
	cursor.style.backgroundColor = '#ffffff';
	cursor.style.height = `${FontHeight}pt`;
	cursor.style.width = '0.36pt';
	cursor.style.position = 'absolute';
	cursor.style.left = '20px';
}


function utfEncode(buf, str){
	const encoder = utfEncode.encoder ??
		(utfEncode.encoder = new TextEncoder());
	encoder.encodeInto(str, buf);
}

class Buffer {
	lines = [];
	cursor = {
		line: 0,
		col: 0,
	};
	
	constructor(text=""){
		this.lines = text.split('\n')
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
initCursor();

let buf = new Buffer();

for(let i = 0; i < buf.lineCount; i++){
	console.log(buf.lines[i]);
}


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
