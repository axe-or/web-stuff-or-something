'use strict';

class Test {
	name = '';
	failed = 0;
	total = 0;
	body = null;

	log(...x){
		console.log('>', ...x);
	}

	table(x){
		console.table(x);
	}

	constructor(name, body){
		this.name = name;
		this.body = body;
	}

	expect(predicate){
		if(!predicate){
			this.failed += 1;
		}
		this.total += 1;
	}

	report(){
		const ok = this.failed === 0;
		const msg = `[${this.name}] `
			+ (ok ? 'PASS' : 'FAIL')
			+ ` ok in ${this.total - this.failed}/${this.total}`;
		console.log(msg);
	}

}

function test(name, body){
	let t = new Test(name, body);
	t.body(t);
	return t.report();
}

// Vim Minify
`
	  %s/name/n/g
	| %s/body/b/g
	| %s/failed/f/g
	| %s/total/t/g
	| %s/predicate/p/g
	| %s/\s*?\s*/\?/g
	| %s/\s*=\s*/=/g
	| %s/\s*+\s*/+/g
	| %s/\s*{\s*/{/g
	| %s/\s*:\s*/:/g
	| %s/\s*,\s*/,/g
	| %s/^\s\+//g
	| g/^\s*$/d
	| %s/\n//g
`
