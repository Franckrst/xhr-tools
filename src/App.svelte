<script>
	import mock,{proxy} from 'xhr-mock';
	let currentModule = 'rbr';
	let _forceUpdate;
	function forceUpdate(){
		_forceUpdate = Date.now();
		requests = [...requests];
	}
	/** ----- RBR ------ */
	let requests = [];
	let currentResponse = {_body:''};
	let currentRequest;
	let currentsubView = 'request';
	let xhrBlocked = false;
	let requestFilter = '';
	function edit(response,resolve,reject){
		return ()=>{
			currentResponse = {response,resolve,reject};
		}
	}
	function _getUrl(request){
		return request._url.protocol +'://'+ request._url.host + request._url.path;
	}
	mock.setup();
	mock.use((request, response)=>{
		return proxy(request, response).then((response) => {
			if(xhrBlocked) {
				console.log('-->',requestFilter.length,requestFilter.replace("*",".*"))
				if ( requestFilter.length &&
					 (new RegExp(requestFilter.replace("*",".*"))).exec(_getUrl(request))
				) {
					console.log("==>", request._url.path);
				}
				request._toolsStatus = "WAIT";
				return new Promise((resolve, reject) => {
							console.log(JSON.stringify(request));
							requests = [{
								request,
								resolve: () => {
									request._toolsStatus = 'SENDED';
									resolve(response);
									forceUpdate();
								},
								reject,
								edit: edit(response._body, resolve, reject),
								show: () => {
									currentRequest = request;
									currentResponse = response
								}
							}, ...requests];
						}
				)
			}else {
				requests = [{
					request,
					show: () => {
						currentRequest = request;
						currentResponse = response
					}
				}, ...requests];
				return response;
			}
		});
	});
	function enableRBR(){
		xhrBlocked = true;
	}
	function disableRBR(){
		xhrBlocked = false
	}
	/** ----- RBR ------ */
</script>
<main>
	<div class="pure-g">
		<div class="pure-u-1-1">
			<div class="pure-menu pure-menu-horizontal">
				<ul class="pure-menu-list">
					<li class="{(currentModule === 'rbr' ? 'pure-menu-selected' : '')+' pure-menu-item'} ">
						<span class="pure-menu-link" on:click={()=>currentModule='rbr'}>Request by Request</span>
					</li>
					<li class="{(currentModule === 'info' ? 'pure-menu-selected' : '')+' pure-menu-item'} ">
						<span class="pure-menu-link" on:click={()=>currentModule='info'}>More infos</span>
					</li>
				</ul>
			</div>
		</div>
		{#if currentModule === 'rbr'}
			<div class="pure-u-1-1">
				<div class="pure-g">
					<div class=" pure-u-1-2">
						{#if xhrBlocked}
							<button class="button-secondary pure-button" on:click={disableRBR}>Disable Debug</button>
						{:else }
							<button class="button-secondary pure-button" on:click={enableRBR}>Enable Debug</button>
						{/if}

						<input type="text" bind:value={requestFilter} placeholder="Filter : https://mon-api.com/produit/*">
						<table class="pure-table">
							<thead>
							<tr>
								<th style="width: 5%">#</th>
								<th style="width: 75%">Url</th>
								<th style="width: 10%">status</th>
								<th style="width: 10%">action</th>
							</tr>
							</thead>
							<tbody>
							{#each requests as { request,resolve,reject,edit,show }, i}
								<tr on:click={show} class="{currentRequest === request ? 'selected': ''}">
									<td>{requests.length - i}</td>
									<td>{_getUrl(request)}</td>
									<td>{request._toolsStatus}</td>
									<td>
										<button class="button-success pure-button" on:click={resolve}>Pass</button>
									</td>
								</tr>
							{/each}
							</tbody>
						</table>
					</div>
					{#if currentRequest}
					<div class="pure-u-1-2">
						<div class="pure-menu pure-menu-horizontal">
							<ul class="pure-menu-list">
								<li class="{(currentsubView === 'request' ? 'pure-menu-selected' : '')+' pure-menu-item'} ">
									<span class="pure-menu-link" on:click={()=>currentsubView='request'}>Request</span>
								</li>
								<li class="{(currentsubView === 'response' ? 'pure-menu-selected' : '')+' pure-menu-item'} ">
									<span class="pure-menu-link" on:click={()=>currentsubView='response'}>Response</span>
								</li>
								<li class="{(currentsubView === 'mock' ? 'pure-menu-selected' : '')+' pure-menu-item'} ">
									<span class="pure-menu-link" on:click={()=>currentsubView='mock'}>Create Mock</span>
								</li>
							</ul>
						</div>
						{#if currentsubView === 'request'}
						<div class="pure-u-1">
							<span>General</span>
							<ul>
								<li><b>url : </b> {currentRequest._url.protocol +'://'+ currentRequest._url.host + currentRequest._url.path}</li>
								<li><b>method : </b> {currentRequest._method}</li>
							</ul>
							<span>Custome Headers</span>
							<ul>
								{#each Object.keys(currentRequest._headers) as headerKey, i}
									<li><b>{headerKey} : </b> {currentRequest._headers[headerKey]}</li>
								{/each}
							</ul>
						</div>
						{:else if currentsubView === 'response'}
						<div class="pure-u-1">
							<div>
							<span>You can edit response.</span>
							<button class="button-success pure-button">pass response</button>
							</div>
							<span>General</span>
							<ul>
								<li><b>status : </b> <input type="text" bind:value={currentResponse._status} disabled={currentRequest._toolsStatus !== 'WAIT'}></li>
								<li><b>reason : </b> <input type="text" bind:value={currentResponse._reason} disabled={currentRequest._toolsStatus !== 'WAIT'}></li>
							</ul>
							<span>Headers</span>
							<ul>
								{#each Object.keys(currentResponse._headers) as headerKey, i}
									<li><b>{headerKey} : </b> {currentResponse._headers[headerKey]}</li>
								{/each}
							</ul>
							<hr/>
							<label for="currentResponseMessage">Body</label>
							<textarea disabled={currentRequest._toolsStatus !== 'WAIT'} style="width: 100%; height: 200px"  id="currentResponseMessage" bind:value={currentResponse._body}></textarea>
						</div>
						{/if}
						<form class="pure-form pure-form-aligned hidden">
							<div class="pure-control-group">
								<label for="currentResponseCode">Code HTTP</label>
								<input type="text" id="currentResponseCode">
							</div>
							<label for="currentResponseMessage">Message</label>
							<button class="button-success pure-button" on:click={edit}>send</button>
						</form>
					</div>
					{/if}
				</div>
			</div>
		{/if}
		{#if currentModule === 'info'}
			<div class="pure-u-1-1">

			</div>
		{/if}
	</div>
</main>

<style type="text/scss">
	@import "~purecss/build/pure.css";

	main {
		position: fixed;
		bottom: 0;
		left: 0;
		background-color: #efefef;
		height: 300px;
		width: 100%;
		tr.selected{
			background-color: #c9f4ff;
		}
		font-size: 80%;
		border: 1px solid #4db1ca;
		.pure-menu{
			border-bottom: 1px solid #4db1ca;
			.pure-menu-item .pure-menu-link{
				border-right: 1px solid #565d64;
			}
		}
	}
	.button-success,
	.button-error,
	.button-warning,
	.button-secondary {
		color: white;
		border-radius: 4px;
		text-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
	}

	.button-success {
		background: rgb(28, 184, 65);
		/* this is a green */
	}

	.button-error {
		background: rgb(202, 60, 60);
		/* this is a maroon */
	}

	.button-warning {
		background: rgb(223, 117, 20);
		/* this is an orange */
	}

	.button-secondary {
		background: rgb(66, 184, 221);
		/* this is a light blue */
	}
</style>
