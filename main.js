'use strict';

/* Import test.js */
class Test{n='';f=0;t=0;b=null;log(...x){console.log('>',...x);}table(x){console.table(x);}constructor(n,b){this.n=n;this.b=b;}expect(p){if(!p){this.f+=1;}this.t+=1;}report(){const ok=this.f===0;const msg=`[${this.n}] `+(ok?'PASS':'FAIL')+` ok in ${this.t - this.f}/${this.t}`;console.log(msg);}}function test(n,b){let t=new Test(n,b);t.b(t);return t.report();}
/*------------*/

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
		if(arr[i] === key){ return true; }
	}
	return false;
}

/* Create an enum, because JS doesn't have them for whatever reason */
function Enum(values){
	if(typeof values !== 'object'){
		throw new TypeError(`Enums must be objects. Got "${typeof values}"`);
	}
	const obj = structuredClone(values);
	Object.freeze(obj);
	return new Proxy(obj, {
		set(target, prop, value){
			throw new TypeError("Enum is not mutable.");
		},
		get(target, prop){
			if(target[prop] === undefined){
				throw new TypeError(`Enum does not have value: ${prop}`);
			}
			return target[prop];
		}
	})
}

/* Token type enum, tokens which can be uniquely identified by their lexeme
 * have it as their value, otherwhise, a unique integer is used */
const TokenKind = Enum({
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
});

/* Token class, the `payload` field may be used to contain the real values of
 * evaluated literals. */
class Token {
	kind = TokenKind.Unknown;
	lexeme = null;
	payload = null;

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

	file = '';
	line = 1;

	static keywords = ['not', 'and', 'or', 'let', 'if', 'else', 'for', 'match', 'fn', 'in' ];

	atEnd(){
		return this.current >= source.length;
	}

	/* Consume character, advancing the lexer. */
	consume(){
		if(this.atEnd()){
			return null;
		}
		this.current += 1;
		let c = this.source[this.current - 1];
		if(c === '\n') { this.line++; }
		return c;
	}

	/* Consume token if it is present in the `accept` set. Returns consumed token, otherwhise returns false. */
	consumeOnMatch(...accept){
		let cur = this.peek(0);
		for(let c of accept){
			if(cur === c){
				this.current += 1;
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

	static escapeSequence(c){
		switch(c){
			case 'n':  return '\n';
			case 'r':  return '\r';
			case 't':  return '\t';
			case 'v':  return '\v';
			case '\\': return '\\';
			case '"':  return '"';
			case '\'': return '\'';
			case 'x': unimplemented('Arbitrary bytes');
			case 'U': unimplemented('Arbitrary codepoint');
		}
		throw new LexerError(`Unknown escape sequence: '\\${c}'`);
	}

	consumeNumber(){
		this.previous = this.current

		const leadingZero = this.peek(0) === '0';
		let token = new Token();

		const p = this.peek(1);
		if(Lexer.isAlpha(p) && leadingZero){ /* Non base-10 integer */
			let base = 0;
			let fn = null;

			let digits = '0';
			switch(p){
				case 'b': fn = Lexer.isBinary; digits += 'b'; break;
				case 'o': fn = Lexer.isOctal;  digits += 'o'; break;
				case 'x': fn = Lexer.isHex;    digits += 'x'; break;
				default: throw LexerError(`Unknown base prefix "${p}"`);
			}

			this.current += 2;

			while(!this.atEnd()){
				const c = this.consume();
				if(c === '_') {
					continue
				}
				else if(!fn(c)){
					this.current -= 1;
					break;
				}
				else {
					digits += c;
				}
			}

			token.payload = BigInt(digits);
			token.kind = TokenKind.Integer_Lit;
			token.lexeme = this.currentLexeme();
		}
		else { /* Decimal integer or Real */
			let digits = '';
			let isReal = false;
			let hasExponent = false;
			
			while(!this.atEnd()){
				const c = this.consume();
				
				if(c === '.' && !isReal){
					digits += c;
					isReal = true;
				}
				else if(c === 'e' && !hasExponent){
					hasExponent = true;
					isReal = true;
					digits += c;
					//console.warn(this.consumeOnMatch('+', '-'), digits);
					digits += this.consumeOnMatch('+', '-') || '';
				}
				else if(c === '_'){
					continue;
				}
				else if(!Lexer.isDecimal(c)){
					this.current -= 1;
					break;
				}
				else {
					digits += c;
				}
			}
			
			token.kind = isReal ? TokenKind.Real_Lit : TokenKind.Integer_Lit;
			token.payload = isReal ? parseFloat(digits) : BigInt(digits);
			token.lexeme = this.currentLexeme();
		}

		return token;
	}

	consumeString(){
		this.previous = this.current - 1;

		let str = '';
		while(true){
			const c = this.consume();

			if(c === '\n'){
				throw new LexerError("Multi line strings are not allowed");
			}
			else if(c === '\\'){
				str += Lexer.escapeSequence(this.consume());
			}
			else if(c === '"'){
				break;
			}
			else if(this.atEnd()){
				throw new LexerError("Unterminated string literal");
			}
			else {
				str += c;
			}
		}

		let token = new Token(TokenKind.String_Lit);
		token.lexeme = this.currentLexeme();
		token.payload = str;

		return token;
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

		if(Lexer.isKeyword(lexeme)){
			token.kind = lexeme;
		}

		return token;
	}

	currentLexeme(){
		return this.source.substring(this.previous, this.current);
	}

	static isKeyword(s){
		return Lexer.keywords.some((kw) => kw === s);
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
			if(s === spaces[i]){ return true; }
		}
		return false;
	}

	static isAlpha(s){
		const pattern = /[a-z]/i;
		return pattern.test(s);
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
						lexer.current -= 1;
						tokens.push(lexer.consumeNumber());
					}
					else if(Lexer.isStartOfIdentifier(c)){
						lexer.current -= 1;
						tokens.push(lexer.consumeIdentifier());
					}
					else if(c === '"'){
						tokens.push(lexer.consumeString());
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

const source = `let x: int = 2e+10;`;
const tokens = Lexer.tokenize(source);

console.table(tokens);
test("Lexer", (T) => {
});

