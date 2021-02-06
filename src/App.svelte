<script>
	import mock,{proxy} from 'xhr-mock';
	let currentModule = 'rbr';
	let open = true;
	let _forceUpdate;
	function forceUpdate(){
		_forceUpdate = Date.now();
		requests = [...requests];
	}
	/** ----- RBR ------ */
	let requests = [];
	let currentResponse = {_body:''};
	let currentRequest, currentResolve;
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
			try {
				const jsonObj = JSON.parse(response._body);
				response._body = JSON.stringify(jsonObj,'','	');
			}catch (e){}
			if( xhrBlocked &&
				(!requestFilter.length || (new RegExp(requestFilter.replace("*",".*"))).exec(_getUrl(request)))
			) {
				request._toolsStatus = "WAIT";
				return new Promise(
					(resolve, reject) => {
						const resolveFnc =  () => {
							request._toolsStatus = 'SENDED';
							resolve(response);
							forceUpdate();
						};
						requests = [{
							request,
							resolve:resolveFnc,
							show: () => {
								currentRequest = request;
								currentResponse = response
								currentResolve = resolveFnc;

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
<main class="{open?'':'close'}" >
	<div class="pure-g pure-u-1-1 d-flex">
		<div class="pure-u-1-1 menu-background">
			<ul class="menu">
				{#if xhrBlocked}
					<li class="{(currentModule === 'rbr' && open ? 'selected' : '')+' item'} " on:click={()=>currentModule='rbr'} >
						<span class="rec"></span>
					</li>
				{/if}
				{#if open}
					<li class="{(currentModule === 'rbr' ? 'selected' : '')+' item'} " on:click={()=>currentModule='rbr'} >
						Request by Request
					</li>
					<li class="{(currentModule === 'info' ? 'selected' : '')+' item'} " on:click={()=>currentModule='info'}>
						More infos
					</li>
					<li class="item item-right" on:click={()=>open=false}>
						Close
					</li>
				{:else}
					<li class="item item-right" on:click={()=>open=true}>
						Open
					</li>
				{/if}
			</ul>
		</div>
		{#if open}
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
							<div>
								<table class="pure-table">
									<thead>
									<tr>
										<th style="width: 5%">#</th>
										<th style="width: 75%">Url</th>
										<th style="width: 10%">status</th>
										<th style="width: 10%">action</th>
									</tr>
									</thead>
								</table>
							</div>
							<div style="overflow-y: scroll; height: 17em;">
								<table class="pure-table">
									<tbody>
									{#each requests as { request,resolve,reject,edit,show }, i}
										<tr on:click={show} class="{currentRequest === request ? 'selected': ''}">
											<td style="width: 5%">{requests.length - i}</td>
											<td style="width: 75%">{_getUrl(request)}</td>
											<td style="width: 10%">{request._toolsStatus.toLowerCase()}</td>
											<td style="width: 10%">
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
						<div class="pure-u-1-2 d-flex d-column content request-container">
							<div class="menu-background pure-menu-horizontal">
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
							<div style="overflow-y: scroll; height: 19em;padding: 1em;">
							{#if currentsubView === 'request'}
								<div class="pure-u-1 flex-1 content">
									<span>General</span>
									<ul>
										<li><b>url : </b> {currentRequest._url.protocol +'://'+ currentRequest._url.host + currentRequest._url.path}</li>
										<li><b>method : </b> {currentRequest._method}</li>
									</ul>
									<span>Custom Headers</span>
									<ul>
										{#each Object.keys(currentRequest._headers) as headerKey, i}
											<li><b>{headerKey} : </b> {currentRequest._headers[headerKey]}</li>
										{/each}
									</ul>
								</div>
							{:else if currentsubView === 'response'}
								<div class="pure-u-1 content">
									{#if currentRequest._toolsStatus === 'WAIT'}
										<p><i>You can edit response.</i></p>
									{/if}
									<span>General</span>
									<ul>
										<li><b>status : </b>
											{#if currentRequest._toolsStatus === 'WAIT'}
												<input type="text" bind:value={currentResponse._status}>
											{:else}
												{currentResponse._status}
											{/if}
										</li>
										<li><b>reason : </b>
											{#if currentRequest._toolsStatus === 'WAIT'}
												<input type="text" bind:value={currentResponse._reason}>
											{:else}
												{currentResponse._reason}
											{/if}
										</li>
									</ul>
									<span>Headers</span>
									<ul>
										{#each Object.keys(currentResponse._headers) as headerKey, i}
											<li><b>{headerKey} : </b> {currentResponse._headers[headerKey]}</li>
										{/each}
									</ul>
									<label for="currentResponseMessage">Body</label>
									<br>
									<textarea disabled={currentRequest._toolsStatus !== 'WAIT'} style="width: 100%; height: 200px"  id="currentResponseMessage" bind:value={currentResponse._body}></textarea>
								</div>
							{/if}
							</div>
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
		&.close{
			height: auto;
		}
		.rec{
			display: inline-block;
			height: 0.6em;
			margin: 0.3em 0em;
			width: 0.6em;
			border-radius: 0.6em;
			background-color: #ff4d4d;
		}
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
			flex-flow: row nowrap;
			display: flex;
			border-bottom: 1px solid #565656;
			.item{
				padding: 0.6em 1em;
				font-size: 0.9em;
				color: #d6d6d6;
				margin: 0;
				display: flex;
				flex: 0 auto;
				cursor: pointer;
				&:hover{
					background-color: #292929;
					color: #FFF;
				}
				&.selected{
					background-color: #000;
					color: #FFF;
				}
				&.item-right {
					margin: 0 0 0 auto;
				}
			}
		}
		.request-container {
			padding: 0;

			.menu .item {
				padding: 0.53rem;
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
	    background: darkslategray;
    	color: white;
	}

	.menu-background {
		background: #333;
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
		border: 1px solid #ffffff;
		color: #ffffff;
	}
</style>
