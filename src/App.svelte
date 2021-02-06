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
			console.log(requestFilter.length)
			if(xhrBlocked && (!requestFilter.length ||
					(new RegExp(requestFilter.replace("*",".*"))).exec(_getUrl(request))
			)
			) {
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
				request._toolsStatus = 'SENDED';
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
	<div class="pure-g pure-u-1-1 d-flex  d-column">
		<div class="pure-u-1-1">
			<ul class="menu">
				<li class="{(currentModule === 'rbr' ? 'selected' : '')+' item'} " on:click={()=>currentModule='rbr'} >Request by Request
				</li>
				<li class="{(currentModule === 'info' ? 'selected' : '')+' item'} " on:click={()=>currentModule='info'}>
					More infos
				</li>
			</ul>
		</div>
		{#if currentModule === 'rbr'}
			<div class="pure-u-1-1 d-flex flex-1">
					<div class="pure-u-1-2 left-panel d-flex d-column">
						<div class="pure-u-1 sub-menu d-flex">
							{#if xhrBlocked}
								<span class="btn-record active" on:click={disableRBR}>&nbsp;</span>
							{:else }
								<span class="btn-record" on:click={enableRBR}>&nbsp;</span>
							{/if}
							<input type="text" bind:value={requestFilter} placeholder="Filter : https://mon-api.com/produit/*">
						</div>
						<div class="pure-u-1 flex-1">
							<div style="height: 100%;overflow-y: scroll;">
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
										<td>{request._toolsStatus.toLowerCase()}</td>
										<td>
											{#if request._toolsStatus === 'WAIT'}
												<div class="action" on:click={resolve}>PASS</div>
											{/if}
										</td>
									</tr>
								{/each}
								</tbody>
							</table>
							</div>
						</div>
					</div>
					{#if currentRequest}
					<div class="pure-u-1-2 d-flex d-column">
						<div class="pure-menu pure-menu-horizontal">
							<ul class="menu">
								<li class="{(currentsubView === 'request' ? 'selected' : '')+' item'} "on:click={()=>currentsubView='request'}>
									Request
								</li>
								<li class="{(currentsubView === 'response' ? 'selected' : '')+' item'} " on:click={()=>currentsubView='response'}>
									Response
								</li>
								<li class="{(currentsubView === 'mock' ? 'selected' : '')+' item'} " on:click={()=>currentsubView='mock'}>
									Create Mock
								</li>
							</ul>
						</div>
						{#if currentsubView === 'request'}
						<div class="pure-u-1 flex-1 content">
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
		display: flex;
		position: fixed;
		bottom: 0;
		left: 0;
		background-color: #333;
		height: 300px;
		width: 100%;
		.left-panel{
			border-right: 1px solid #565656;
			margin-left: -1px;
		}
		.sub-menu{
			padding: 0.3em;
			.btn-record{
				cursor: pointer;
				display: flex;
				width: 0.5em;
				height: 0.5em;
				margin: 0.2em 0.4em;
				border-radius: 1em;
				font-size: 2em;
				background-color: #565656;
				&.active{
					background-color: #ff4d4d;
				}
			}
			input{
				width: 50%;
				color: #FFF;
			}
		}

		.menu{
			margin: 0;
			padding: 0;
			flex-direction: row;
			display: flex;
			border-bottom: 1px solid #565656;
			.item{
				padding: 0.6em 1em;
				font-size: 0.9em;
				color: #d6d6d6;
				margin: 0;
				display: flex;
				cursor: pointer;
				&:hover{
					background-color: #292929;
					color: #FFF;
				}
				&.selected{
					background-color: #000;
					color: #FFF;
				}
			}
		}
		.pure-table{
			width: 100%;
			border-color: #565656 !important;
			border-right: none;
			border-left: none;
			*{
				border-color: #565656 !important;
			}
			thead,tbody{
				background-color: inherit;
			}
			tr{
				border-top:1px solid #565656 !important;
			}
			td, th {
				padding: 0.35em !important;
				font-style: normal !important;
				font-weight: normal;
				color: #d6d6d6;
			}
			tr:nth-child(even) {background: #373434
			}
			tr:nth-child(odd) {background: #2f2f2f
			}
			tr.selected{
				background-color: #606c76;
			}
			.action{
				font-size: 0.8em;
				background-color: #616161;
				padding: 0.3em;
				text-align: center;
				cursor: pointer;
			}
		}
		font-size: 80%;
		border-top: 1px solid #d6d6d6;
	}
	.content{
		padding: 1em;
		color: #b7b7b7;
	}

	.d-flex{
		display: flex;
	}
	.flex-1{
		flex: 1;
	}
	.d-column{
		flex-direction: column;
	}
	input[type=text]{
		height: 1.8em;
		background-color: #1f1f1f;
		border: 1px solid;
	}
</style>
