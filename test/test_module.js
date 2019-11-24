module.exports = (init_opts) => {
	var rt_p_web = {x:Math.random(),y:Math.random()};
	//with(rt_p_web){
	//	console.log({x,y,z});
	//	return x+y;
	//}
	with(rt_p_web){
		z = x + y;
	}
	return rt_p_web;
}
