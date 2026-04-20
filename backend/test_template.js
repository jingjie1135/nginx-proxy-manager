import fs from 'fs';
import { Liquid } from 'liquidjs';

const templateRaw = fs.readFileSync('./templates/proxy_host.conf', 'utf8');

const engine = new Liquid({
	root: './templates',
	extname: '.conf'
});

const mockHostData = {
	id: 1,
	enabled: 1,
	has_upstream: false,
	forward_scheme: 'http',
	forward_host: 'mirror.zeabur.app',
	forward_port: 80,
	domain_names: ['ohmy.zeabur.app'],
	use_default_location: true,
	advanced_config: '',
	locations: '',
	allow_websocket_upgrade: false,
	ssl_forced: false,
	hsts_enabled: false,
	hsts_subdomains: false,
	certificate_id: 0
};

engine.parseAndRender(templateRaw, mockHostData)
	.then(result => {
		console.log("\n=================== SUCCESS! No Upstream ===================\n");
		console.log(result);
	})
	.catch(err => {
		console.error("FAIL No Upstream:", err);
	});

const mockHostDataUpstream = { ...mockHostData, 
	has_upstream: true, 
	is_mixed_scheme: false,
	load_balance_method: 'round_robin',
	upstream_scheme: 'http',
	upstream_servers: [
		{ scheme: 'http', server: 'mirror.zeabur.app', port: 80, weight: 1 }
	]
};

engine.parseAndRender(templateRaw, mockHostDataUpstream)
	.then(result => {
		console.log("\n=================== SUCCESS! With Upstream ===================\n");
		console.log(result);
	})
	.catch(err => {
		console.error("FAIL With Upstream:", err);
	});
