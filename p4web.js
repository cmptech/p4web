//Object/Array/String/Number/Boolean/RegExp/null/undefined
//BigInt
module.exports = (init_opts) => {
	const rt_p_web = {
		loop: (o,f)=>{for(var k in o){f(k,o[k])}},
		build_libs : (a=[],rt={}) => (a.map((v,k)=>(rt[v]=require(v))),rt),
		P:async(f)=>('function'==typeof f)?new Promise(f):f,
		hasFunction:()=>('function'==typeof Function),
		hasJSON:()=>('object'==typeof JSON),
		hasGlobal:()=>('undefined'==typeof global),
		hasArray:()=>('function'==typeof Array),
		trycatch:(fn,flagIgnoreErr=false)=>{try{return fn()}catch(ex){return flagIgnoreErr?'':ex}},
		getRegExpMatch: (re,s) => { if(!re) return re; var ra=re.exec(s); return (ra && ra[1]) ? ra[1] : "" },
		argv2o : a => (a || require('process').argv || []).reduce((r, e) => ((m = e.match(/^(\/|--?)([\w-]*)="?(.*)"?$/)) && (r[m[2]] = m[3]), r), {}),
		//
		doNothing : (p)=>(p||{}),
		nothing:(o)=>o,//little diff from doNothing...
		nothing_p:async(f)=>f,
		is : (o,t='')=> (typeof t=='string') ? (typeof(o)==t) : (o instanceof t),
	};
	with(rt_p_web){
		var libs = build_libs(['http','https','net','url','zlib','querystring','fs','os','crypto']);
		const
		o2s = (o,f)=>trycatch(()=>JSON.stringify(o),undefined==f?true:f),
		s2o = (s,f)=>trycatch( hasFunction() ? ()=>Function('return '+s)() : ()=>JSON.parse(s) ,undefined==f?true:f),
		o2o = (o1, o2, o3)=>{
			if (o3) for (var k in o3) { o1[o3[k]] = o2[o3[k]] }
			else for (var k in o2) { o1[k] = o2[k] };
			return o1;
		};
		P.delay = (t) => P(resolve=>setTimeout(resolve,t>0?t:1));
		P.all = (a=[]) => Promise.all(a);
		P.reject = (o) => Promise.reject(o);
		P.resolve = (o) => Promise.resolve(o);
		var moment;
		o2o(rt_p_web,libs);
		o2o(rt_p_web,{
			o2s,s2o,o2o,

			isObject:(o)=>is(o,'object'),
			ifFunction:(f)=>is(f,'function'),
			isDate:(o)=>is(o,Date),
			isNumber:(n)=>is(n,Number)||is(n,'number'),
			isNull:(o)=>(o===null),
			isUndef:(o)=>(o===undefined),
			isBool:(b)=>(b===true||b===false),
			isArray:(a)=>is(a,Array),
			isEmpty:(o,i)=>{for(i in o){return!1}return!0},
			
			trycatch_p : async(fn=nothing,flagIgnoreErr=false) => {
				try{
					return await fn()
				}catch(ex){
					return flagIgnoreErr ? P.resolve('') : P.reject(ex)
				}
			},

			base64_encode : (t='') => Buffer.from(t).toString('base64'),
			base64_decode : (t='') => Buffer.from(t, 'base64').toString(),
			cookie_o2s : o => libs.querystring.stringify(o, ';'),
			cookie_s2o : (s='',rt={},p=[])=>(s.split(';').forEach(ss=>(p=ss.split('='),rt[p.shift().trim()]=p.join('='))),rt),

			PSTS : (STS, rst, errmsg, errcode) => P({ STS, rst, errmsg, errcode }),
			POK : (rst, errmsg, errcode) => PSTS('OK', rst, errmsg, errcode),
			PKO : (rst, errmsg, errcode) => PSTS('KO', rst, errmsg, errcode),
			isOK : (o) => (o && o.STS == 'OK'),
			isAllOK : (ra)=>{ var b=false; for(var k in ra){ if(!isOK(ra[k]))return false; b=true; } return b; },

			date : (dt) => (dt || new Date()),

			getTime : (dt) => date(dt).getTime(),
			timezoneOfet : (dt) => date(dt).getTimezoneOffset(),
			timeStamp : (dt)=> (getTime(dt)/1000),
			now : () => getTime(),
			md5 : s=>crypto.createHash('md5').update(s).digest("hex"),
			//md5: function(){for(var m=[],l=0;64>l;)m[l]=0|4294967296*Math.abs(Math.sin(++l));return function(c){var e,g,f,a,h=[];c=unescape(encodeURI(c));for(var b=c.length,k=[e=1732584193,g=-271733879,~e,~g],d=0;d<=b;)h[d>>2]|=(c.charCodeAt(d)||128)<<8*(d++%4);h[c=16*(b+8>>6)+14]=8*b;for(d=0;d<c;d+=16){b=k;for(a=0;64>a;)b=[f=b[3],(e=b[1]|0)+((f=b[0]+[e&(g=b[2])|~e&f,f&e|~f&g,e^g^f,g^(e|~f)][b=a>>4]+(m[a]+(h[[a,5*a+1,3*a+5,7*a][b]%16+d]|0)))<<(b=[7,12,17,22,5,9,14,20,4,11,16,23,6,10,15,21][4*b+a++%4])|f>>>32-b),e,g];for(a=4;a;)k[--a]=k[a]+b[a]}for(c="";32>a;)c+=(k[a>>3]>>4*(1^a++&7)&15).toString(16);return c}}(),
			uuid : (d=getTime()) => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
				var r = (d + Math.random() * 16) % 16 | 0; d = Math.floor(d / 16);
				return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
			}),
			getTimeStr2 : function(dt, fmt, tz='Asia/Beijing') {
				if (!moment) {
					moment = require('moment-timezone');
					moment.tz.setDefault(tz);
				}
				if (!dt) dt = new Date();
				if (!fmt) fmt = 'YYYY-MM-DD HH:mm:ss.SSS';
				return moment(dt).format(fmt);
			},
			//TODO time_pattern() in future
			//YYYY-MM-DD HH:mm:ss
			//YYYY-MM-DD HH:mm:ss.SSS
			//NOTES: fmt is not support yet... PLAN using masking for fmt is cool, such as 0b111110000011111000 or string '1111-11' with predefined name, fmt_a:{'YYYY':'1111',....}
			//TODO
			//const getTimeStr = (dt, fmt = 'YYYY-MM-DD HH:mm:ss', tz) => (dt = dt || new Date(), (new Date(dt.getTime() + ((tz === null) ? 0 : ((tz || tz === 0) ? tz : (-dt.getTimezoneOffset() / 60))) * 3600 * 1000)).toISOString().replace('T', ' ').substr(0, fmt.length));
			getTimeStr : (dt, fmt, tz) => (dt = dt || new Date(), (new Date(dt.getTime() + ((tz === null) ? 0 : ((tz || tz === 0) ? tz : (-dt.getTimezoneOffset() / 60))) * 3600 * 1000)).toISOString().replace('T', ' ').substr(0, 19)),
			options : o2o(argv2o(), init_opts),
			//
			load_raw : (fn,flagIgnoreErr=true) => trycatch(()=>libs.fs.readFileSync(fn),flagIgnoreErr),
			save_raw : (fn,s,flagIgnoreErr=true) => trycatch(()=>libs.fs.writeFileSync(fn,(!s||typeof(s)=='string')?s:o2s(s),'utf-8'),flagIgnoreErr),
			load : (fn) => s2o(load_raw(fn)),
			save : (fn,o) => save_raw(fn,o2s(o)),
			//old:
			loadCookieFromFileRaw : (fn) => load_raw(fn+'.cookie'),
			loadCookieFromFile : (fn) => (fn && fn.indexOf('.raw') >= 0) ? loadCookieFromFileRaw(fn) : s2o(load_raw(fn+'.cookie')),
			saveCookieToFileRaw : (fn, ck) => save_raw(fn+'.cookie',ck),
			saveCookieToFile : (fn, ck) => saveCookieToFileRaw(fn, (fn && fn.indexOf('.raw') >= 0) ? ck : o2s(ck)),

			stream2buffer_p : (stream) => P( (resolve, reject) =>{
				if(stream){
					var _bf = Buffer.alloc(0);
					stream.on('data', function(chunk) {
						_bf = Buffer.concat([_bf,chunk]);
					}).on('end', function() {
						resolve(_bf);
					}).on('error', function(err) {
						reject(err);
					});
				}
			}),
		});
		//
		var {debug_level=0,logger=console, cookie_pack='default',cookie_readonly=false, agent, proxy_server } = options;
		if(!agent && proxy_server){
			var proxy_opts = libs.url.parse(proxy_server);
			agent = options.agent = new require(
				((['http:','https:'].indexOf(proxy_opts.protocol)>=0)?'https':'socks')+'-proxy-agent'
			)(proxy_opts);
		}
		//
		o2o(rt_p_web,{
			setDebugLevel : d => { if (d > 0) logger.log('.setDebugLevel=', d); debug_level = d; },
			//@ref http://www.primaryobjects.com/2012/11/19/parsing-hostname-and-domain-from-a-url-with-javascript/
			//PROBLEM: even read RFC 2965, still unknown how to get better for ("www.example.com" and "example.co.ca") etc.
			getDomain:(hostName)=>{
				var domain = hostName;
				if (hostName != null) {
					var parts = hostName.split('.').reverse();

					if (parts != null && parts.length > 1) {
						domain = parts[1] + '.' + parts[0];
						//TODO need to fix for co.ca etc...
						if (hostName.toLowerCase().indexOf('.co.uk') != -1 &&
							parts.length > 2) {
							domain = parts[2] + '.' + domain;
						}
					}
				}
				return domain;
			},
		});

		rt_p_web.build_post = (headers, post_data, post_type='o2s') => {

			if (!post_data) return null;
			if (typeof(post_data) == 'string' && post_type != "multipart") return post_data;

			function Build_Form_Part(name, value, boundaryKey, filename) {
				if (!filename) {
					if (typeof(value) == 'object') {
						filename = name;
					}
				}
				//@ref http://www.rfc-base.org/rfc-1867.html
				var crlf = "\r\n",
					boundary = `--${boundaryKey}`,
					delimeter = `${crlf}--${boundary}`,
					sep = [
						'Content-Disposition: form-data; name="' + name + '"' +
						(filename ? ('; filename="' + filename + '"') : '') +
						crlf
					];
				return [
					new Buffer(delimeter + crlf + sep.join('') + crlf),
					(typeof(value) == 'Buffer') ? value : (new Buffer(value)),
				];
			}

			switch (post_type) {
				case 'o2s': return o2s(post_data); break;
				case 'post': return libs.querystring.stringify(post_data); break;
				case 'form':
				case 'binary':
					var crlf = "\r\n",
						boundaryKey = Math.random().toString(16);

					var s_a = [];
					for (var k in post_data) {
						s_a = s_a.concat(Build_Form_Part(k, post_data[k], boundaryKey));
					}
					s_a = s_a.concat(new Buffer(`${crlf}----${boundaryKey}--`));

					headers['Content-Type'] = 'multipart/form-data; boundary=' + `--${boundaryKey}`;

					return Buffer.concat(s_a);
				case 'multipart':
					var reg = /--(.*?)\r/;
					var mmm = reg.exec(post_data);
					if(mmm && mmm[1])
						headers['Content-Type'] =  'multipart/form-data; boundary='+mmm[1];
					return post_data;
				default:
					throw new Error('unsupport post type ' + post_type);
			}
		};

		var _concur_c = 0; //inner counter...
		var _concur_max = 9;
		rt_p_web.concur_timeout = 1111;//
		rt_p_web.setConcurMax = (m, tmt) => { _concur_max = 1 * m; if (tmt >= 0) rt_p_web.concur_timeout = tmt; };

		var _task_q = [];
		var _concur_checking = false; //concur lock...fine for single-thread nodejs ;)
		var _process_task_q = function() {
			if (!(_concur_c >= _concur_max))(_task_q.pop() || (() => { _concur_checking = false }))();
			if (_concur_checking) setTimeout(() => _process_task_q(), rt_p_web.concur_timeout)
		}

		//do once:
		rt_p_web.web1_p = (call_opts, post_s_or_o, post_type) => P( async(resolve, reject)=>{
			var rt = { STS: 'KO' };
			try {
				rt.call_opts = call_opts;
				var reqp = o2o({}, (typeof(call_opts) == 'string') ? libs.url.parse(call_opts) : call_opts);

				if(!reqp.agent && options.agent) reqp.agent = options.agent;//using default agent if any.

				var _url = reqp.url;
				var _hostname = reqp.hostname;
				if (!_hostname) {
					o2o(reqp, libs.url.parse(_url));
					_hostname = reqp.hostname;
				}
				var web;
				if (reqp.protocol == 'https:') web = libs.https;
				else if (reqp.protocol == 'http:') web = libs.http;
				else web = libs.net;

				if (!reqp.headers) reqp.headers = {};
				if (!reqp.headers['user-agent']) reqp.headers['user-agent'] = "Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.19 Safari/537.36";

				//////////////////////////////////////////////// handle cookies before send {
				var _domain = getDomain(_hostname);
				var cookies_pack_id = reqp.cookie_pack || options.cookie_pack || (e => { throw new Error(e) })('.cookie_pack is mandatory now because share cookie file not good.');
				var cookies_pack_a = reqp.resetCookie ? {} : (loadCookieFromFile(cookies_pack_id) || {});
				//var req_cookie_a = cookies_pack_a || {};
				var req_cookie_a = cookies_pack_a[_domain] || {};

				//insert/update
				if (reqp.headers['Cookie']) {
					var req_cookies_s = reqp.headers['Cookie'];
					if (req_cookies_s) { o2o(req_cookie_a, cookie_s2o(req_cookies_s)); }
				}
				if (reqp.cookies_full) { req_cookie_a = reqp.cookies_full; }
				else if (reqp.cookies_full_s) { req_cookie_a = cookie_s2o(reqp.cookies_full_s); }

				//TODO 
				//.obj_add(req_cookie_a,cookies_add), o2o
				//.obj_sub(req_cookie_a,cookies_sub), o9o
				if (reqp.cookies_add) { //add
					for (var k in reqp.cookies_add) {
						req_cookie_a[k] = reqp.cookies_add[k];
					}
				}

				if (reqp.cookies_sub) { //delete
					for (var k in reqp.cookies_sub) {
						delete(req_cookie_a[k]);
					}
				}

				var req_cookie_s = libs.querystring.stringify(req_cookie_a, ';');
				if (debug_level > 3) {
					logger.log('req_cookie_a=', req_cookie_a);
					logger.log('req_cookie_s=', req_cookie_s);
				}

				reqp.headers['Cookie'] = req_cookie_s;
				//cookies_pack_a = o2o(cookies_pack_a,req_cookie_a);
				cookies_pack_a[_domain] = req_cookie_a;

				if (cookie_readonly) {}
				else { saveCookieToFile(cookies_pack_id, cookies_pack_a); }

				rt.req_cookie = req_cookie_a;
				rt.req_cookie_s = req_cookie_s;
				//////////////////////////////////////////////// handle cookies before send }

				var post_s = reqp.post_s || rt_p_web.build_post(reqp.headers, post_s_or_o, post_type);

				if (reqp['Content-Type']) reqp.headers['Content-Type'] = reqp['Content-Type'];

				if (post_s) {
					if (!reqp.headers['Content-Type'])
						reqp.headers['Content-Type'] = "application/x-www-form-urlencoded;charset=utf-8";

					reqp.headers['Content-Length'] = Buffer.byteLength(post_s);
					if(!reqp.method) //update to POST if empty
						reqp.method = 'POST';
				}
				var _accept_language = reqp['Accept-Language'] || "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4";
				reqp.headers['Accept-Language'] = _accept_language;

				//"application/json, text/javascript, */*; q=0.01";
				if (!reqp.headers['Accept'])
					reqp.headers['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";

				//@ref https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
				var _accept_encoding = reqp['Accept-Encoding'] || "gzip";
				reqp.headers['Accept-Encoding'] = _accept_encoding;

				if (!reqp.headers['Referer']) {
					reqp.headers['Referer'] = reqp.referer_s || reqp.referer || reqp.Referer || reqp.href;
				}
				var timeout_check = reqp.timeout_check || 30000;
				var tm_check = setTimeout(() => {
					if (tm_check) { resolve({ STS: "KO", errcode:504, errmsg: "timeout for " + timeout_check / 1000 + " sec..." }); }
				}, timeout_check);

				var tm0 = now();
				if (debug_level > 3) {
					logger.log('DEBUG', 'post_s=', post_s);
					logger.log('DEBUG', 'reqp=', reqp);
				}

				//try{
				var resp = await P((r,j)=>(web.request || web.createConnection)(reqp,r).on('error',j).end(post_s));

				var _encoding = reqp.encoding || '';

				var buff;
				rt.statusCode = resp.statusCode;
				var resp_headers = rt.headers = resp.headers || {};
				var content_encoding = resp_headers['content-encoding'];

				///////////////////////////////////////////////////////// handle cookies afterward {
				var headers_set_cookie_a = resp_headers['set-cookie'] || []; 
				var cookies_pack_a = loadCookieFromFile(cookies_pack_id) || {};
				var _Cookies = cookies_pack_a[_domain] || {};
				//var _Cookies = cookies_pack_a || {};
				if (headers_set_cookie_a && headers_set_cookie_a.length>0) {
					var f_update = false;
					headers_set_cookie_a.forEach(function(headers_set_cookie) {
						if (debug_level > 3)
							logger.log('set cookie', headers_set_cookie);
						o2o(_Cookies, cookie_s2o(headers_set_cookie));
						f_update = true;
					});
					if (f_update) {
						rt.cookies = _Cookies;
						cookies_pack_a[_domain] = _Cookies;
						//cookies_pack_a = o2o(cookies_pack_a,_Cookies);
						if (cookie_readonly!=false) {}
						else { saveCookieToFile(cookies_pack_id, cookies_pack_a); }
					}
				}
				///////////////////////////////////////////////////////// cookie }

				if(call_opts.return_raw==true){
					resolve(o2o(rt,{resp,STS:'OK'}));//external handling
				}else{
					buff = await stream2buffer_p(resp);
					rt.exectime = now() - tm0;
					rt.buff = buff;//some binary/file return needs
					if (content_encoding == 'gzip') {
						rt.gz_len = Buffer.byteLength(buff);
						var buff_s = buff.toString();
						var decoded = libs.zlib.gunzipSync(buff);
						var body; //= decoded ? decoded.toString() : "";
						//TODO add base64 handling here.
						if (_encoding) { // special handling for gb2312 etc.
							var iconv = require('iconv-lite');
							body = iconv.decode(decoded, _encoding) || "";
						}
						else { body = decoded ? decoded.toString() : ""; }
						rt.body = body;
						rt.body_len = body.length; //Buffer.byteLength(body);
						rt.STS = 'OK';
						resolve(rt);
						if((!body) && buff_s){
							logger.log('DEBUG: web1_p failed to decode',rt.gz_len,buff);
						}
					}
					else if (content_encoding == 'deflate') {
						rt.zip_len = rt.gz_len = Buffer.byteLength(buff);
						libs.zlib.inflate(buff, function(err, decoded) {
							var body = decoded ? decoded.toString() : "";
							rt.body = body;
							rt.body_len = body.length; //body?body.length:0;
							rt.STS = 'OK';
							resolve(rt);
						});
					}
					else { //assuming plain-text..
						var buff_s;
						if (_encoding == 'base64') { //deprecated, for some old interfaces only
							buff_s = buff.toString('base64') || "";
						}
						else if (_encoding) { //special for gb2312 etc.
							var iconv = require('iconv-lite');
							buff_s = iconv.decode(buff, _encoding) || "";
						}
						else { buff_s = buff.toString(); }
						rt.body = buff_s;
						if (!buff_s) {
							rt.reqp = reqp; //for debug only
						} else {
							rt.body_len = buff_s.length;
							rt.STS = 'OK';
						}
						resolve(rt);
					}
				}
			}
			catch (ex) {
				rt.errmsg = '' + ex;
				resolve(rt);
			}
			clearTimeout(tm_check);
		})//web1_p
		;
		rt_p_web.web_p = (call_opts, post_s_or_o, post_type) => P( (resolve, reject) =>{
			//enqueue
			_task_q.push(() => (++_concur_c,
				rt_p_web.web1_p(call_opts, post_s_or_o, post_type)
				.catch(err => err)
				.then(rst => (--_concur_c, resolve(rst)))
			));
			if (!_concur_checking) { //schedule queue:
				_concur_checking = true;
				setTimeout(_process_task_q, 1);
			}
		});
	}
	return rt_p_web;
}
