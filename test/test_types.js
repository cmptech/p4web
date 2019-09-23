var p4web=require('../p4web')();
var {logger,getRegExpMatch,is,isObject,date,isDate,getTime,isNumber,isNull,isUndef,isBool,isArray,isEmpty,
		flag_JSON,
		flag_Function,
		flag_global,
	options,
}=p4web;
logger.log({flag_JSON,flag_global,flag_Function});
logger.log('options=',options);
//var assert = (c1,c2) => (c1===c2) ? true : false;
logger.log(getRegExpMatch(/.*(xx).*/,'yyxxzz')?1:0);
logger.log(getRegExpMatch(/.*(xx).*/,'yyyxzz')?1:0);
logger.log(is(p4web,Object),typeof(p4web));
logger.log(is(logger,Function),typeof(logger));
logger.log(is("haha",String),typeof("haha"));
logger.log(is(new Date(),Date),typeof(new Date()));
logger.log(is(null,Object),typeof(null));
logger.log(is(11,Object),typeof(11));
logger.log(is(false,Boolean),typeof(false));
logger.log(is(true,Boolean),typeof(true));
logger.log(is(/x/,RegExp),typeof(/x/));
logger.log(isObject(/x/));
logger.log(isDate(date()));
logger.log(isDate(getTime()));
logger.log(isDate(getTime()));
logger.log('isNumber:',isNumber(0),isNumber(1),isNumber(1/0),typeof(1/0),1/0,Infinity,typeof(Infinity),Math.sqrt(-1),NaN,typeof(NaN),isNumber(1.1));
logger.log(isNull(0),isNull(null),isNull(undefined));
logger.log(isUndef(false),isUndef(0),isUndef(null),isUndef(undefined));
logger.log(isBool(true),isBool(false),isBool(0),isBool(null),isBool(undefined));
logger.log(isArray([]),isArray([0]),isArray({}));
logger.log(isEmpty(0),isEmpty([]),isEmpty({}),isEmpty(null));
