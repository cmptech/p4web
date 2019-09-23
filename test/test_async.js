//var nothing = (o)=>o;
//var nothing_p = async(f)=>f;
//var async_p=async(f)=>('function'==typeof f)?f():f;
//
////var P = function(o){ return (typeof(o)=='function') ? new Promise(o) : Promise.resolve(o); };
//var P = function(o){return async_p(o)};
//
////console.log(nothing_p(),nothing_p(null),nothing_p(0),nothing_p(nothing));
//P(()=>null)
//.then(rst=>console.log('rst=',rst))
//;
//
//P(11)
//.then(rst=>console.log('rst=',rst))
//;
//
//P.all=(a=[])=>Promise.all(a);
//console.log(P.all([]));
//
//console.log(typeof(P));
//console.log(typeof(new P()));

p4web = require('../p4web')();
var {P,POK}=p4web;
//POK().then(r=>console.log(r));

P((resolve,rejectd)=>{
		setTimeout(resolve,1111);
		}).then(r=>console.log(r));
