var module_name = 'p4web';// p4web - Promise For Web

module.exports = function(init_opts) {

	const getRegExpMatch = (re,s) => { var ra=re.exec(s); return (ra && ra[1]) ? ra[1] : "" };
	
	const isEmpty=(o,i)=>{for(i in o){return!1}return!0}
	
	const argv2o = a => (a || process.argv || []).reduce((r, e) => ((m = e.match(/^(\/|--?)([\w-]*)="?(.*)"?$/)) && (r[m[2]] = m[3]), r), {});

	const o2s = function(o) { try { return JSON.stringify(o); } catch (ex) { if (debug_level > 2) logger.log('JSON.stringify.err=', ex) } };
	//const s2o=function(s){try{return JSON.parse(s);}catch(ex){}};//which only accepts {"m":"XXXX"} but fail for parsing like {m:"XXXX"}
	const s2o = function(s) { try { return (new Function('return ' + s))() } catch (ex) {} }; //NOTES: some env not support new Function
	function o2o(o1, o2, o3) {
		if (o3) {
			for (var k in o3) { o1[o3[k]] = o2[o3[k]] };
		}
		else {
			for (var k in o2) { o1[k] = o2[k] };
		}
		return o1;
	}
	const copy_o2o = o2o; //@deprecated, for old codes...

	//: .debug_level, .logger, .cookie_pack, .cookie_readonly
	const options = o2o(argv2o(), init_opts);

	var debug_level = options.debug_level || 0;

	const logger = options.logger || console;

	const http = require('http');
	const https = require('https');
	const net = require('net');
	const url = require('url');
	const zlib = require('zlib');
	const querystring = require('querystring');
	const fs = require('fs');
	const os = require('os');

	var P = function(o){ //NOTES: don't use arrow func on construtor !
		return (typeof(o)=='function') ? new Promise(o) : Promise.resolve(o);
	};
	P.delay = (timeout) => P(resolve=>setTimeout(()=>resolve(),timeout||1));
	P.all = (a) => Promise.all(a);
	P.reject = (o) => Promise.reject(o);
	P.resolve = (o) => Promise.resolve(o);

	const PSTS = (STS, rst, errmsg, errcode) => P({ STS, rst, errmsg, errcode });
	const POK = (rst) => PSTS('OK', rst);
	const PKO = (rst, errmsg, errcode) => PSTS('KO', rst, errmsg, errcode);

	const isOK = (o) => (o && o.STS == 'OK');
	function isAllOK(ra){ var b=false; for(var k in ra){ if(!isOK(ra[k]))return false; b=true; } return b; }

	//NOTES: fmt is not support yet... PLAN using masking for fmt is cool, such as 0x111110000011111000 or string '1111-11' with predefined name
	//fmt_a:{'YYYY':'1111',....}
	const getTimeStr = (dt, fmt, tz) => (dt = dt || new Date(), (new Date(dt.getTime() + ((tz === null) ? 0 : ((tz || tz === 0) ? tz : (-dt.getTimezoneOffset() / 60))) * 3600 * 1000)).toISOString().replace('T', ' ').substr(0, 19));

	//backup plan if fmt really needs, but it depends on moment-timezone lib
	var moment = null; //require('moment-timezone');//for datetime
	const getTimeStr2 = function(dt, fmt) {
		if (!moment) {
			moment = require('moment-timezone');
			moment.tz.setDefault("Asia/Hong_Kong");
		}
		if (!dt) dt = new Date();
		if (!fmt) fmt = 'YYYY-MM-DD HH:mm:ss.SSS';
		return moment(dt).format(fmt);
	};

	const base64_encode = t => Buffer.from(t).toString('base64');
	const base64_decode = t => Buffer.from(t, 'base64').toString();

	//function cookie_o2s(o){ return querystring.stringify(o,';'); }
	const cookie_o2s = o => querystring.stringify(o, ';');

	function cookie_s2o(s) {
		var rt = {};
		if (s && s != "") {
			s.split(';').forEach(function(ss) {
				var parts = ss.split('=');
				rt[parts.shift().trim()] = parts.join('=').trim();
			});
		}
		return rt;
	}

	//@ref http://www.primaryobjects.com/2012/11/19/parsing-hostname-and-domain-from-a-url-with-javascript/
	//PROBLEM: even read RFC 2965, still unknown how to get better for ("www.example.com" and "example.co.ca") etc.
	function getDomain(hostName) {
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
	}

	function loadCookieFromFile(fn) {
		if (fn && fn.indexOf('.raw') >= 0) return loadCookieFromFileRaw(fn);
		var rt = {};
		try {
			rt = s2o(fs.readFileSync(fn + ".cookie", 'utf-8'));
		}
		catch (ex) {
			if (debug_level > 3) logger.log("readFileSync tmp " + fn + " .txt ex=", ex);
		}
		return rt;
	}

	function loadCookieFromFileRaw(fn) {
		var rt = "";
		try {
			rt = fs.readFileSync(fn + ".cookie", 'utf-8');
		}
		catch (ex) {
			if (debug_level > 3) logger.log("readFileSync tmp " + fn + " .txt ex=", ex);
		}
		return rt;
	}

	function saveCookieToFile(fn, ck) {
		if (fn && fn.indexOf('.raw') >= 0) {
			return saveCookieToFileRaw(fn, ck);
		}
		else {
			return saveCookieToFileRaw(fn, o2s(ck));
		}
	}

	function saveCookieToFileRaw(fn, ck) {
		try {
			return fs.writeFileSync(fn + ".cookie", ck, 'utf-8');
		}
		catch (ex) {
			if (debug_level > 3) logger.log("writeFileSync tmp " + fn + " .txt ex=", ex);
		}
		return false;
	}

	//const stream2bf=(st,cb)=>{var bf = new Buffer(0);mapEvents(st,{error:e=>cb(''+e),data:c=>bf=Buffer.concat([bf, c]),end:()=>cb(bf)})}
	//const stream2buffer_p = (st) => P( (resolve,reject) => {var bf = new Buffer(0);mapEvents(st,{error:e=>reject(e),data:c=>bf=Buffer.concat([bf, c]),end:()=>cb(bf)})});
	const stream2buffer_p = (stream) => P( (resolve, reject) =>{
		var _bf = new Buffer(0);
		stream.on('data', function(chunk) {
			_bf = Buffer.concat([_bf,chunk]);
		}).on('end', function() {
			resolve(_bf);
		}).on('error', function(err) {
			reject(err);
		});
	});
	//prev
	//function stream2buffer_p(stream){
	//	return P( (resolve, reject) =>{
	//		//var _bf = new Buffer();
	//		var _bf = [];
	//		stream.on('data', function(chunk) {
	//			_bf.push(chunk);//TODO rt.concat([chunk]);
	//		}).on('end', function() {
	//			resolve(Buffer.concat(_bf));
	//		}).on('error', function(err) {
	//			reject(err);
	//		});
	//	});
	//}

	const setDebugLevel = d => {
		if (d > 0) logger.log(module_name + '.setDebugLevel=', d);
		debug_level = d;
	};

	var rt_p_web = {
		options,
		logger,
		argv2o,
		getRegExpMatch,
		isEmpty,
		o2s,
		s2o,
		o2o,
		copy_o2o,
		stream2buffer_p,
		base64_encode,
		base64_decode,
		P,
		PSTS,
		POK,
		PKO,
		setDebugLevel,
		getDomain,
		getTimeStr,
		getTimeStr2,
		isOK,
		isAllOK,
		loadCookieFromFile,
		saveCookieToFile,
		loadCookieFromFileRaw,
		saveCookieToFileRaw,
		fs,
		url,
		https,
		http,
		net,
		os,
		filename: (typeof(__filename) != 'undefined') ? __filename : '???',
	};

	rt_p_web.build_post = (headers, post_data, post_type) => {

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

		if (!post_type) post_type = 'o2s'; //default o2s mode

		switch (post_type) {
			case 'o2s':
				return o2s(post_data);
				break;
			case 'post':
				return querystring.stringify(post_data);
				break;
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
				var rt = reg.exec(post_data);
		
				headers['Content-Type'] =  'multipart/form-data; boundary='+rt[1];
			  return post_data;
			default:
				throw new Error('unsupport post type ' + post_type);
		}
	};

	var _concur_c = 0; //inner counter...
	var _concur_max = 9;
	rt_p_web.concur_timeout = 1111;
	rt_p_web.setConcurMax = (m, tmt) => { _concur_max = 1 * m; if (tmt >= 0) rt_p_web.concur_timeout = tmt; };
	var _task_q = [];
	var tm;
	var _concur_checking = false; //concur lock...fine for single-thread nodejs ;)
	var _process_task_q = function() {
		if (!(_concur_c >= _concur_max))(_task_q.pop() || (() => { _concur_checking = false }))();
		if (_concur_checking) setTimeout(() => _process_task_q(), rt_p_web.concur_timeout)
	}

	//NOTES: seems concurrent in macox has strange ssl problem.  will try to improve in future ...
	//do once:
	rt_p_web.web1_p = (opts, post_s_or_o, post_type) => P( (resolve, reject)=>{
		var rt = { STS: 'KO' };
		try {
			rt.opts = opts;
			var reqp = o2o({}, (typeof(opts) == 'string') ? url.parse(opts) : opts);

			if(!reqp.agent && options.agent) reqp.agent = options.agent;//using default agent if any.

			var _url = reqp.url;
			var _hostname = reqp.hostname;
			if (!_hostname) {
				o2o(reqp, url.parse(_url));
				_hostname = reqp.hostname;
			}
			var web;
			if (reqp.protocol == 'https:') web = https;
			else if (reqp.protocol == 'http:') web = http;
			else web = net;

			if (!reqp.headers) reqp.headers = {};
			if (!reqp.headers['user-agent']) reqp.headers['user-agent'] = "Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.19 Safari/537.36";

			//////////////////////////////////////////////// handle cookies before send {
			var _domain = getDomain(_hostname);
			var cookies_pack_id = reqp.cookie_pack || options.cookie_pack || (e => { throw new Error(e) })(module_name + '.cookie_pack is mandatory now because share cookie file not good.');
			var cookies_pack_a = reqp.resetCookie ? {} : (loadCookieFromFile(cookies_pack_id) || {});
			var req_cookie_a = cookies_pack_a[_domain] || {};

			var cookie_readonly = options.cookie_readonly || false;

			//insert/update
			if (reqp.headers['Cookie']) {
				var req_cookies_s = reqp.headers['Cookie'];
				if (req_cookies_s) {
					o2o(req_cookie_a, cookie_s2o(req_cookies_s));
				}
			}
			if (reqp.cookies_full) { //full replacement
				req_cookie_a = reqp.cookies_full;
			}
			else
				if (reqp.cookies_full_s) { //full replace with str
					req_cookie_a = cookie_s2o(reqp.cookies_full_s);
				}

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

			var req_cookie_s = querystring.stringify(req_cookie_a, ';');
			if (debug_level > 3) {
				logger.log('req_cookie_a=', req_cookie_a);
				logger.log('req_cookie_s=', req_cookie_s);
			}

			reqp.headers['Cookie'] = req_cookie_s;
			cookies_pack_a[_domain] = req_cookie_a;

			if (cookie_readonly) {}
			else {
				saveCookieToFile(cookies_pack_id, cookies_pack_a);
			}

			rt['req_cookie'] = req_cookie_a;
			rt['req_cookie_s'] = req_cookie_s;
			//////////////////////////////////////////////// handle cookies before send }

			var post_s = reqp.post_s || rt_p_web.build_post(reqp.headers, post_s_or_o, post_type);

			if (reqp['Content-Type']) reqp.headers['Content-Type'] = reqp['Content-Type'];

			if (post_s) {
				if (!reqp.headers['Content-Type'])
					reqp.headers['Content-Type'] = "application/x-www-form-urlencoded;charset=utf-8";

				reqp.headers['Content-Length'] = Buffer.byteLength(post_s);
				reqp.method = 'POST';
			}
			var _accept_language = reqp['Accept-Language'] || "zh-CN,zh;q=0.8,en;q=0.6,zh-TW;q=0.4";
			reqp.headers['Accept-Language'] = _accept_language;

			//"application/json, text/javascript, */*; q=0.01";
			if (!reqp.headers['Accept'])
				reqp.headers['Accept'] = "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8";

			//"gzip,deflate,sdch";
			var _accept_encoding = reqp['Accept-Encoding'] || "gzip";
			reqp.headers['Accept-Encoding'] = _accept_encoding;

			if (!reqp.headers['Referer']) {
				if (reqp.referer_s) {
					reqp.headers['Referer'] = reqp.referer_s;
				}
				else if (reqp.referer) {
					reqp.headers['Referer'] = reqp.referer;
				}
				else if (reqp.Referer) {
					reqp.headers['Referer'] = reqp.Referer;
				}
				else{
					reqp.headers['Referer'] = reqp.href;//TODO...
				}
			}
			var timeout_check = reqp.timeout_check || 30000;
			var tm_check = setTimeout(() => {
				if (tm_check) {
					resolve({ STS: "KO", errmsg: "timeout for " + timeout_check / 1000 + " sec..." });
				}
			}, timeout_check);

			var tm0 = (new Date()).getTime();
			if (debug_level > 3) {
				logger.log('DEBUG', 'post_s=', post_s);
				logger.log('DEBUG', 'reqp=', reqp);
			}
			var req = (web.request || web.createConnection)(reqp, async(resp) => {
				var _encoding = reqp.encoding || '';

				if(!resp)resp={};
				if(!resp.headers)resp.headers={};

				var content_encoding = resp.headers['content-encoding'];

				try{
					var buff = await stream2buffer_p(resp);
				}catch(err){
					return reject(err);
				}
				rt['statusCode'] = resp.statusCode;
				var headers = resp.headers || {};
				rt['headers'] = headers;

				///////////////////////////////////////////////////////// cookie {
				var cookie_s_in_header = headers['Cookie'] || "";
				var headers_set_cookie_a = resp.headers['set-cookie']; //注意它是个数组...
				var cookies_pack_a = loadCookieFromFile(cookies_pack_id) || {};
				var _Cookies = cookies_pack_a[_domain] || {};
				if (headers_set_cookie_a) {
					var f_update = false;
					headers_set_cookie_a.forEach(function(headers_set_cookie) {
						if (debug_level > 3)
							logger.log('set cookie', headers_set_cookie);
						o2o(_Cookies, cookie_s2o(headers_set_cookie));
						f_update = true;
					});
					if (f_update) {
						rt['cookies'] = _Cookies;
						cookies_pack_a[_domain] = _Cookies;
						if (cookie_readonly) {}
						else {
							saveCookieToFile(cookies_pack_id, cookies_pack_a);
						}
					}
				}
				///////////////////////////////////////////////////////// cookie }

				rt['exectime'] = (new Date()).getTime() - tm0;

				if (content_encoding == 'gzip') {
					rt['gz_len'] = Buffer.byteLength(buff);
					var buff_s = buff.toString();
					try {
						var decoded = zlib.gunzipSync(buff);
						var body; //= decoded ? decoded.toString() : "";
						if (_encoding) {
							var iconv = require('iconv-lite');
							body = iconv.decode(decoded, _encoding) || "";
						}
						else {
							body = decoded ? decoded.toString() : "";
						}
						rt['body'] = body;
						rt['body_len'] = body.length; //Buffer.byteLength(body);
						rt.STS = 'OK';
						resolve(rt);
					}
					catch (ex) {
						logger.log('DBG', ex);
						reject(ex);
					}
					//if((!body) && buff_s){
					//	logger.log('DEBUG: web1_q failed to decode',rt['gz_len'],buff_s);
					//}
				}
				else if (content_encoding == 'deflate') {
					rt['gz_len'] = Buffer.byteLength(buff);
					zlib.inflate(buff, function(err, decoded) {
						var body = decoded ? decoded.toString() : "";
						rt['body'] = body;
						rt['body_len'] = body.length; //body?body.length:0;
						rt.STS = 'OK';
						resolve(rt);
					});
				}
				else {
					var buff_s;
					if (_encoding == 'base64') { //deprecated, for some old interfaces
						buff_s = buff.toString('base64') || "";
					}
					else if (_encoding) {
						var iconv = require('iconv-lite');
						buff_s = iconv.decode(buff, _encoding) || "";
					}
					else {
						buff_s = buff.toString();
					}
					rt.body = buff_s;
					if (!buff_s) {
						rt.reqp = reqp; //for debug only
					}
					else {
						rt['body_len'] = buff_s.length;
						rt.STS = 'OK';
					}
					resolve(rt);
				}
				clearTimeout(tm_check);
			}).on('error', err => {
				logger.log(`problem with request: ${err.message}`);
				clearTimeout(tm_check);
				resolve({ STS: "KO", errmsg: "" + err });
			});
			if (post_s) {
				req.write(post_s)
			}
			if (debug_level > 2) logger.log('---- before req.end()',reqp.url || reqp.href);
			req.end();
		}
		catch (ex) {
			rt.errmsg = '' + ex;
			return resolve(rt);
		}
	})
	;//web_p

	rt_p_web.web_p = (opts, post_s_or_o, post_type) => P( (resolve, reject) =>{
		//enqueue
		_task_q.push(() => (++_concur_c,
			rt_p_web.web1_p(opts, post_s_or_o, post_type)
			.catch(err => err)
			.then(rst => (--_concur_c, resolve(rst)))
		));
		//schedule queue:
		if (!_concur_checking) {
			_concur_checking = true;
			setTimeout(_process_task_q, 1);
		}
	});

	return rt_p_web;
}
