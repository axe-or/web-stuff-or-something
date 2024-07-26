'use strict';

/* Import test.js */
class Test{n='';f=0;t=0;b=null;log(...x){console.log('>',...x);}table(x){console.table(x);}constructor(n,b){this.n=n;this.b=b;}expect(p){if(!p){this.f+=1;}this.t+=1;return p;}report(){const ok=this.f===0;const msg=`[${this.n}] `+(ok?'PASS':'FAIL')+` ok in ${this.t - this.f}/${this.t}`;console.log(msg);}}function test(n,b){let t=new Test(n,b);t.b(t);return t.report();}
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
	
	Caret: '^',

	Not: 'not',
	And: 'and',
	Xor: 'xor',
	Or: 'or',

	Let: 'let',
	If: 'if',
	Else: 'else',
	For: 'for',
	Match: 'match',
	Fn: 'fn',
	In: 'in',
	T

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

	toString(){
		switch(this.kind){
		case TokenKind.Identifier: {
			return `Id(${this.lexeme})`
		} break;

		case TokenKind.String_Lit: {
			return `String(${this.payload})`
		} break;

		case TokenKind.Integer_Lit: {
			return `Int(${this.payload})`
		} break;

		case TokenKind.Real_Lit: {
			return `Real(${this.payload})`
		} break;

		default: {
			return this.kind;
		}
		}
	}

	isLiteral(){
		switch(this.kind){
			case TokenKind.Identifier:
			case TokenKind.String_Lit:
			case TokenKind.Integer_Lit:
			case TokenKind.True:
			case TokenKind.False:
			case TokenKind.Real_Lit: return true; break;
		}
		return false;
	}
	
	isOperator(){
		const operators = new Set([
			'+', '-', '/', '*', '%',
			'&', '|', '~', '<<', '>>',
			'==', '!=', '>=', '<=',
			'and', 'or', 'xor', '.',
		]);
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

	static keywords = new Set(['not', 'xor', 'and', 'or', 'let', 'if', 'else', 'for', 'match', 'fn', 'in']);

	atEnd(){
		return this.current >= this.source.length;
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

	consumeLineComment(){
		this.previous = this.current;

		while(!this.atEnd()){
			const c = this.consume();
			if(c == '\n'){
				break;
			}
		}
	}

	/* Consume number, real or integer. Integers support bases: 2, 8, 10, 16 */
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
		return Lexer.keywords.has(s);
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
					lexer.consumeLineComment();
				} else {
					addToken(TokenKind.Slash);
				}
			} break;
			case '%': addToken(TokenKind.Modulo); break;

			case '~': addToken(TokenKind.Bit_Xor); break;
			case '&': addToken(TokenKind.Bit_And); break;
			case '|': addToken(TokenKind.Bit_Or); break;
			case '^': addToken(TokenKind.Caret); break;

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

			case '!':{
				if(lexer.consumeOnMatch('=')){
					addToken(TokenKind.Not_Equal);
				} else {
					throw new LexerError(`Expected '='`);
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

class Expression {
	type = null;

	toString(){
		throw new TypeError("Cannot call abstract method");
	}
}

class BinaryExpr extends Expression {
	left = null;
	right = null;
	operator = TokenKind.Unknown;

	constructor(left, op, right){
		super();
		const ok = (left instanceof Expression) && (right instanceof Expression);
		if(!ok){
			throw new ParserError("Expression operands must be expressions");
		}
		this.left = left;
		this.right = right;
		this.operator = op;
	}

	toString(){
		return `(${this.operator} ${this.left.toString()} ${this.right.toString()})`
	}
}

class UnaryExpr extends Expression {
	operand = null;
	operator = TokenKind.Unknown;

	constructor(op, operand){
		super();
		const ok = operand instanceof Expression;
		if(!ok){
			throw new ParserError("Expression operands must be expressions");
		}
		this.operator = op;
		this.operand = operand;
	}

	toString(){
		return `(${this.operator} ${this.operand.toString()})`
	}
}

class PrimaryExpr extends Expression {
	token = null;

	constructor(token){
		super();
		if(!token.isLiteral() && (token.kind !== TokenKind.Identifier)){
			throw new ParserError("Invalid token kind for primary expression");
		}
		this.token = token;
	}

	toString(){
		return `${this.token.toString()}`
	}
}

/* Left associative infix binding power */
const opLeft = (p) => [p, p+1];
/* Right associative infix binding power */
const opRight = (p) => [p+1, p];

class Parser {
	current = 0;
	tokens = [];

	atEnd(){
		return this.current >= this.tokens.length;
	}

	consume(){
		if(this.atEnd()){
			return null;
		}
		this.current += 1;
		return this.tokens[this.current - 1];
	}

	peek(delta){
		const pos = this.current + delta;
		if(pos < 0 || pos >= this.tokens.length){
			return new Token(TokenKind.End_Of_File);
		}
		return this.tokens[pos];
	}

	parseExpression(minBp){
		assert(typeof minBp === 'number');

		let tk = this.consume();
		let left = null;
		if(tk.isLiteral() || tk.kind === TokenKind.Identifier){
			left = new PrimaryExpr(tk);
		}
		else if(tk.isOperator()){
			let rightBp = prefixBindingPower(tk.kind);
			let right = this.parseExpression(rightBp);
			return new UnaryExpr(tk.kind, right);
		}
		else {
			unimplemented(`Not an operator ${tk}`);
		}

		while(!this.atEnd()){
			let op = this.peek(0); /* Lookahead */

			let postfix = Parser.postfixBindingPower(op.kind);
			if(postfix !== null){
				let leftBp = postfix;
				if(leftBp < minBp){
					break;
				}

				this.consume();
				left = new UnaryExpr(op.kind, left);
				continue;
			}

			let infix = Parser.infixBindingPower(op.kind);
			if(infix !== null) {
				console.table(infix)
				let [leftBp, rightBp] = infix;
				if(leftBp < minBp){
					break;
				}

				this.consume();
				let right = this.parseExpression(rightBp);
				left = new BinaryExpr(left, op.kind, right);
				continue;
			}

			unimplemented("What " + tk.toString());
		}

		return left;
	}

	static parse(tokens){
		let parser = new Parser(tokens);
		return parser.parseExpression(0);
	}

	static infixBindingPower(operator){
		const entry = Parser.infixOperators[operator] ?? null;
		console.table(operator, entry);
		if(entry === null){
			return null;
		}
		return entry;
	}

	static prefixBindingPower(operator){
		const entry = Parser.prefixOperators[operator] ?? null;
		if(entry === null){
			return null;
		}
		return entry;
	}

	static postfixBindingPower(operator){
		const entry = Parser.postfixOperators[operator] ?? null;
		if(entry === null){
			return null;
		}
		return entry;
	}

	constructor(tokens){
		this.tokens = tokens;
	}

	static infixOperators = {
		'==': opLeft(10),
		'!=': opLeft(10),
		'>=': opLeft(10),
		'<=': opLeft(10),
		
		'+': opLeft(40),
		'-': opLeft(40),

		'*': opLeft(60),
		'%': opLeft(60),
		'/': opLeft(60),
	};

	static prefixOperators = {
		'+': 100,
		'-': 100,
		'~': 100,
		'&': 140,
	};

	static postfixOperators = {
		'^': 120,
		'[': 180, /* Special case for Indexing */
	};
}

test("Lexer", (T) => {
	function formatTokens(tokens){
		let fmt = '';
		for(let i = 0; i < tokens.length; i++){
			fmt += tokens[i] + ' ';
		}
		return fmt.substring(0, fmt.length-1);
	}
	const testCases = [
		[`()[]{}`, `( ) [ ] { }`],
		[`.,:;`, `. , : ;`],
		[`+-*/%`, `+ - * / %`],
		[`>>><<<~&|`, `>> > << < ~ & |`],
		[`>=<===!=`, `>= <= == !=`],
		[`let if else for x match fn and not or xor`, `let if else for Id(x) match fn and not or xor`],
		[`0xff 0b10_01 0o10 1_23_4`, `Int(255) Int(9) Int(8) Int(1234)`],
		[`1.0 -0.5_0 1e9 1e+3 1e-3`, `Real(1) - Real(0.5) Real(1000000000) Real(1000) Real(0.001)`],
		[`"Hi" "\\"Quoted\\"" "With\\n Escapes"`, `String(Hi) String("Quoted") String(With\n Escapes)`],
		[`// Nothing here`, ``],

	];
	for(let i = 0; i < testCases.length; i += 1){
		const tokens = Lexer.tokenize(testCases[i][0]);
		const formatted = formatTokens(tokens);
		T.expect(formatted === testCases[i][1]) || T.log(formatted);
	}
});

test("Parser", (T) => {
	const source = '-x + 2 == 23 / 4 + 0xcafebabe^';
	let tokens = Lexer.tokenize(source);
	let root = Parser.parse(tokens);
	console.log(root.toString());
});
