var p4web=require('../p4web')({cookie_pack:'web1'});
(async()=>await p4web.web1_p('https://www.google.com/'))().then(console.log);
