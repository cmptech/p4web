var p4web=require('../p4web')({cookie_pack:'web1'});
//(async()=>await p4web.web1_p('https://ipv4.jump.ws/',"rnd="+Math.random()))().then(console.log);
(async()=>await p4web.web1_p(`https://ipv4.jump.ws/`,`rnd=${Math.random()}`))().then(console.log);

//console.log(
//p4web.cookie_s2o("dwf_sg_task_completion=False; _ga=GA1.2.84019357.1558407983; lux_uid=157457568904475608; _gid=GA1.2.2095598523.1574575689; messages='8032c4dbb603e9dfb076aa7421365cc6fbcdec41$[[\"__json_message\"\0541\05430\054\"Redirected from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions_and_function_scope/Strict_mode\"\054\"wiki_redirect\"]]'")
//p4web.cookie_s2o("k1=k2,k3=k4;k4=5")
//)
for (var k in p4web){
	var v= p4web[k];
	console.log(k,'=>',typeof(v));
}
console.log(p4web.P);
