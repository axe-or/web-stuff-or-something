'use strict';

/* Import test.js */
class Test{name='';failed=0;total=0;body=null;letructor(name,body){this.name=name;this.body=body;}expect(pred){if(!pred){this.failed+=1;}this.total+=1;}report(){let ok=this.failed===0;let msg=`[${this.name}] `+(ok?'PASS':'FAIL')+` ok in ${this.total - this.failed}/${this.total}`;console.log(msg);}}function test(name,body){let t=new Test(name,body);t.body(t);return t.report();}
/******************/

/* Assert a predicate, emit error if false */
function assert(pred){
	if(!pred){
		throw new Error("Failed assertion");
	}
}

/* Used for unimplemented code */
function unimplemented(msg = ""){
	console.error(`Unimplemented: ${msg}`);
	throw new Error("Unimplemented code");
}

/* Check if array contains key */
function contains(arr, key){
	for(let i = 0; i < arr.length; i++){
		if(arr[i] == key){ return true; }
	}
	return false;
}

/* Token type enum, tokens which can be uniquely identified by their lexeme
 * have it as their value, otherwhise, a unique integer is used */
const TokenKind = {
	Unknown: null,

	Paren_Open: '(',
	Paren_Close: ')',
	Square_Open: '[',
	Square_Close: ']',
	Curly_Open: '{',
	Curly_Close: '}',

	Dot: '.',
	Colon: ':',
	Semicolon: ';',
	Comma: ',',
	Equal: '=',

	Less: '<',
	Greater: '>',
	Less_Equal: '<=',
	Greater_Equal: '>=',
	Equal_Equal: '==',
	Not_Equal: '!=',

	Plus: '+',
	Minus: '-',
	Star: '*',
	Modulo: '%',
	Slash: '/',

	Bit_Xor: '~',
	Bit_Or: '|',
	Bit_And: '&',
	Shift_Left: '<<',
	Shift_Right: '>>',

	Not: 'not',
	And: 'and',
	Or: 'or',

	Let: 'let',
	If: 'if',
	Else: 'else',
	For: 'for',
	Match: 'match',
	Fn: 'fn',
	In: 'in',

	Identifier: 1,
	String_Lit: 2,
	Integer_Lit: 3,
	Real_Lit: 4,

	End_Of_File: -1,

	get(_, name){
		if(_TokenKind[name] === undefined){
			throw new LexerError(`No such keyword: "${name}"`);
		}
		return _TokenKind[name];
	},

	keyword(lexeme){
		const first = lexeme.substring(0, 1).toUpperCase();
		const rest = lexeme.substring(1);
		return TokenKind[first+rest] ?? null;
	},
}


/* Token class, the `payload` field may be used to contain the real values of
 * evaluated literals. */
class Token {
	kind = TokenKind.Unknown;
	lexeme = null;

	constructor(kind, lexeme = null){
		assert(lexeme === null || typeof lexeme === 'string');
		this.kind = kind;
		this.lexeme = lexeme;
	}
}

/* Errors */
class LexerError extends Error {
	constructor(msg){
		super(msg);
		this.name = "LexerError";
	}
}
class ParserError extends Error {
	constructor(msg){
		super(msg);
		this.name = "ParserError";
	}
}

/* A Lexer works as a context to consume a source file and transform it into a
 * list of tokens. A Lexer does not need to be instantiated explicitly, prefer
 * to just use the static method Lexer.tokenize() */
class Lexer {
	source = "";
	current = 0;
	previous = 0;

	atEnd(){
		return this.current >= source.length;
	}

	/* Consume character, advancing the lexer. */
	consume(){
		if(this.atEnd()){
			return null;
		}
		this.current += 1;
		return this.source[this.current - 1];
	}

	/* Consume token if it is present in the `accept` set. Returns consumed token, otherwhise returns false. */
	consumeOnMatch(...accept){
		let cur = this.peek(0);
		for(let c of accept){
			if(cur == c){
				return c;
			}
		}
		return false;
	}

	/* Peek `delta` tokens from current */
	peek(delta){
		let pos = this.current + delta;
		if(pos < 0 || pos >= this.source.length){
			return null;
		}
		return this.source[pos];
	}

	consumeNumber(){
		unimplemented("Number");
	}

	consumeIdentifier(){
		this.previous = this.current;

		while(!this.atEnd()){
			let c = this.consume();
			if(!Lexer.isIdentifier(c)){
				this.current -= 1;
				break;
			}
		}

		let lexeme = this.currentLexeme();
		let token = new Token(TokenKind.Identifier, lexeme);

		if(TokenKind.keyword(lexeme)){
			token.kind = lexeme;
		}

		return token;
	}

	currentLexeme(){
		return this.source.substring(this.previous, this.current);
	}

	static isStartOfIdentifier(s){
		const pattern = /^[a-zA-Z_]+/i;
		return pattern.test(s);
	}

	static isIdentifier(s){
		const pattern = /^[0-9a-z_]+/i;
		return pattern.test(s);
	}

	static isDecimal(s){
		const pattern = /[0-9]+/i;
		return pattern.test(s);
	}

	static isHex(s){
		const pattern = /[0-9a-f]+/i;
		return pattern.test(s);
	}

	static isOctal(s){
		const pattern = /[0-7]+/i;
		return pattern.test(s);
	}

	static isBinary(s){
		return s === '0' || s === '1';
	}

	static isWhitespace(s){
		const spaces = Object.freeze([' ', '\n', '\t', '\r', '\v']);
		for(let i = 0; i < spaces.length; i ++){
			if(s == spaces[i]){ return true; }
		}
		return false;
	}

	static tokenize(source){
		let lexer = new Lexer(source);
		let tokens = [];
		const addToken = (kind, lexeme=null) =>
			tokens.push(new Token(kind, lexeme));

		while(true){
			const c = lexer.consume();
			if(c === null){ break }

			switch(c){
				case '(': addToken(TokenKind.Paren_Open); break;
				case ')': addToken(TokenKind.Paren_Close); break;
				case '[': addToken(TokenKind.Square_Open); break;
				case ']': addToken(TokenKind.Square_Close); break;
				case '{': addToken(TokenKind.Curly_Open); break;
				case '}': addToken(TokenKind.Curly_Close); break;

				case ':': addToken(TokenKind.Colon); break;
				case ';': addToken(TokenKind.Semicolon); break;
				case '.': addToken(TokenKind.Dot); break;
				case ',': addToken(TokenKind.Comma); break;
				case '=':{
					if(lexer.consumeOnMatch('=')){
						addToken(TokenKind.Equal_Equal);
					} else {
						addToken(TokenKind.Equal);
					}
				} break;

				case '+': addToken(TokenKind.Plus); break;
				case '-': addToken(TokenKind.Minus); break;
				case '*': addToken(TokenKind.Star); break;
				case '/':{
					if(lexer.consumeOnMatch('/')){
						unimplemented("Comments");
					} else {
						addToken(TokenKind.Slash);
					}
				} break;
				case '%': addToken(TokenKind.Modulo); break;

				case '~': addToken(TokenKind.Bit_Xor); break;
				case '&': addToken(TokenKind.Bit_And); break;
				case '|': addToken(TokenKind.Bit_Or); break;

				case '>':{
					if(lexer.consumeOnMatch('>')){
						addToken(TokenKind.Shift_Right);
					}
					else if(lexer.consumeOnMatch('=')){
						addToken(TokenKind.Greater_Equal);
					} else {
						addToken(TokenKind.Greater);
					}
				} break;

				case '<':{
					if(lexer.consumeOnMatch('<')){
						addToken(TokenKind.Shift_Left);
					} else if(lexer.consumeOnMatch('=')){
						addToken(TokenKind.Less_Equal);
					} else {
						addToken(TokenKind.Less);
					}
				} break;


				default: {
					if(Lexer.isWhitespace(c)){
						continue;
					}
					else if(Lexer.isDecimal(c)){
						console.warn("Decimal");
					}
					else if(Lexer.isStartOfIdentifier(c)){
						lexer.current -= 1;
						tokens.push(lexer.consumeIdentifier());
					}
					else if(c == '"'){
						console.warn("String");
					}
					else {
						throw new LexerError(`Unrecognized character: '${c}'`);
					}
				} break;
			}
		}

		return tokens;
	}

	constructor(source){
		this.source = source;
	}
}

const source = "let x: int = 34 - 3 / 5 + (1 << 7);";
const tokens = Lexer.tokenize(source);
console.table(tokens);


