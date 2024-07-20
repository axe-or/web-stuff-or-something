function assert(pred){
	if(!pred){
		throw new Error("Failed assertion");
	}
}

function unimplemented(msg = ""){
	console.error(`Unimplemented: ${msg}`);
	throw new Error("Unimplemented code");
}

class TokenKind {
	static Unknown = null;
	
	static Paren_Open   = '(';
	static Paren_Close  = '(';
	static Square_Open  = '[';
	static Square_Close = ']';
	static Curly_Open   = '{';
	static Curly_Close  = '}';
	
	static Dot       = '.';
	static Colon     = ':';
	static Semicolon = ';';
	static Comma     = ',';
	static Equal     = '=';
	 
	static Less          = '<';
	static Greater       = '>';
	static Less_Equal    = '<=';
	static Greater_Equal = '>=';
	static Equal_Equal   = '==';
	static Not_Equal     = '!=';
	
	static Plus   = '+';
	static Minus  = '-';
	static Star   = '*';
	static Slash  = '/';
	static Modulo = '%';

	static Bit_Xor     = '~';
	static Bit_Or      = '|';
	static Bit_And     = '&';
	static Shift_Left  = '<<';
	static Shift_Right = '>>';
	
	static Not = 'not';
	static And = 'and';
	static Or  = 'or';
	
	static Let   = 'let';
	static If    = 'if';
	static Else  = 'else';
	static For   = 'for';
	static Match = 'match';
	static Fn    = 'fn';
	static In    = 'in';
	
	static Identifier  = 1;
	static String_Lit  = 2;
	static Integer_Lit = 3;
	static Real_Lit    = 4;
	
	static End_Of_File = -1;
}

class Token {
	kind = TokenKind.Unknown;
	lexeme = null;
	
	constructor(kind, lexeme = null){
		assert(lexeme === null || typeof lexeme === 'string');
		this.kind = kind;
		this.lexeme = lexeme;
	}
}

class Lexer {
	source = "";
	current = 0;
	previous = 0;
	
	/* Has lexer exhaused its source? */
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
	
	static tokenize(source){
		let lexer = new Lexer(source);
		let tokens = [];
		const addToken = (kind, lexeme=null) =>
			tokens.push(new Token(kind, lexeme));
		
		while(true){
			const c = lexer.consume();
			if(c === null){ break }
			
			switch(c){
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
					if(Lexer.isDecimal(c)){
						
					}
					else {
						
					}
					//unimplemented("ids, strings, and numbers");
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
