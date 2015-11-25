//iScrollRefresh 选项卡加上拉刷新 下拉加载
//hugcolin@163.com

var iScrollRefresh = function(tab_id,bd_id,parames){

	var config = {
		pullDown:{
			height:60,
			nextTime:3600, //当没有更新的数据后，间隔多少时间才能再次下拉刷新，单位：秒
			html:'<span class="ico"><i></i></span><span class="tip"><b>下拉刷新...</b><i></i></span>',
			except:[],
			contentDown:'下拉刷新...',
			contentHover:'释放立即刷新...',
			contentRefresh:'正在刷新...',
			contentNomore:'没有更多新数据了...',
			callback:null,
			animation:null
		},
		pullUp:{
			height:40,
			html:'<span class="ico"></span><span class="tip">上拉加载更多</span>',
			except:[],
			contentUp:'上拉加载更多...',
			contentHover:'释放立即加载...',
			contentRefresh:'正在加载...',
			contentNomore:'没有更多数据了...',
			callback:null,
			animation:null
		},

		tabs:'tabs',
		tabs_bd:'tabs-bd',
		slide:null
	};
	var _this = this;

	var pullDownStatus = false; //是否开始下拉刷新
	var pd_height = config.pullDown.height; //下拉多少长度后开始刷新
	var pullDownHtml = config.pullDown.html;
	var pullDownLoading = []; //正在加载中的数组

	var pullUpStatus = false;
	var pd_pullUpHeight = config.pullUp.height;
	var pullUpHtml = config.pullUp.html;
	var pullUpLoading = [];

	var tabsScroll;//选项卡的滚动对象
	var tabsBdScrollers = [];
	var tabElements;

	var bdScroll;
	var bdWidth;
	var bdScrolls = [];

	var bdMoving = false;  //选项卡内容是否在横向滚动
	var scrollStartY,scrollStartX,scrollStartTime,noMore,lastUpdate,allowPullDown,allowPullUp,loadedAll;
	function createScroll(){

		/*计算选项卡的宽度并初始化scroll*/
		tabElements = document.getElementById(config.tabs).getElementsByTagName('div')[0].getElementsByTagName('a');
		var tabWidth = 0;
		for(var i = 0; i<tabElements.length;i++){
			tabWidth += tabElements[i].offsetWidth;
		}
		tabWidth+=1;
		document.getElementById(config.tabs).getElementsByTagName('div')[0].style.width = tabWidth+'px';
		tabsScroll = new IScroll('#'+config.tabs, { scrollX: true, scrollY:false, snap:'a', click:true });

		var swiper = document.getElementById(config.tabs_bd).getElementsByTagName('div')[0];
		bdWidth = document.getElementById(config.tabs_bd).offsetWidth;
		var bdHeight = document.getElementById(config.tabs_bd).offsetHeight;
		var warppers = swiper.getElementsByClassName('wrapper');
		swiper.style.width = bdWidth*warppers.length + 'px';
		for(i = 0; i<warppers.length;i++){
			warppers[i].style.width = bdWidth+'px';
			warppers[i].style.height = bdHeight+'px'
			var warpperId = warppers[i].id || 'scroll-warpper-'+i;
			warppers[i].id = warpperId;
			tabElements[i].setAttribute('href','#'+warpperId);
			tabElements[i].id = 'tab-'+warpperId;

			bdScrolls[i] = new IScroll('#'+warpperId, { probeType: 3, click:true});
			var pullDownDiv = document.createElement('div');
			pullDownDiv.className = 'pullDownTip';
			pullDownDiv.innerHTML = pullDownHtml;
			warppers[i].appendChild(pullDownDiv);

			var pullUpDiv = document.createElement('div');
			pullUpDiv.className = 'pullUpTip';
			pullUpDiv.innerHTML = pullUpHtml;
			warppers[i].appendChild(pullUpDiv);
			
			bdScrolls[i].on('scrollStart', scrollStartHandler);
			bdScrolls[i].on('scroll', scrollMoveHandler);
			bdScrolls[i].on('scrollEnd', scrollEndHandler);

			pullDownLoading[i] = false;
			
		}

		bdScroll = new IScroll('#'+config.tabs_bd, { scrollX: true, scrollY:false, momentum: false, snap:true });
		//bdScroll.on('scrollStart', bdStartHandler);
		//bdScroll.on('scroll', bdMoveHandler);
		bdScroll.on('scrollEnd',bdEndHandler);
		initTab();

	}

	function initTab(){
		//初始化点击选项卡的事件 和 下方滑动改变选项卡事件
		for(var i = 0; i<tabElements.length;i++){
			
			tabElements[i].addEventListener('click',function(event){
				event.preventDefault();
				var target = event.target || event.srcElement;
				var index = target.getAttribute('href').replace('#scroll-warpper-','');
				bdScroll.goToPage(parseInt(index),0,500);
			},false)
		}

		
	}


	function setTop(that,num){
		jelle(that.scroller).animate({top:'0px'},500);
	}

	function setPullDownTip(that,tip){
		//设置提示
		getPullDownTip(that).querySelector('.tip b').innerHTML = tip;
	}

	function setRotate(that,flag){
		//设置旋转动画
		if(_this.downAnimation){
			var parame = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				downTip:getPullDownTip(that),
				status:flag
			}
			_this.downAnimation(param);
			return;
		}
		if(flag == 0){
			var rotate = that.y/pd_height*180;
			getPullDownTip(that).querySelector('.ico i').style.transform = 'rotate('+rotate+'deg)';
		}
	}

	function getPullDownTip(that){

		return that.wrapper.querySelector('.pullDownTip');
	}

	function setPullUpTip(that,tip){
		getPullUpTip(that).querySelector('.tip').innerHTML = tip;
	}
	function setUpRotate(that,flag){
		if(_this.upAnimation){
			var parame = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				downTip:getPullUpTip(that),
				status:flag
			}
			_this.upAnimation(param);
			return;
		}

		//设置旋转动画
		var rotate = 180;
		if(flag == 0){
			getPullUpTip(that).querySelector('.ico').className = 'ico';
			getPullUpTip(that).querySelector('.ico').style.transform = 'rotate('+rotate+'deg)';
		}else if(flag == 1){
			rotate = 0;
			getPullUpTip(that).querySelector('.ico').className = 'ico';
			getPullUpTip(that).querySelector('.ico').style.transform = 'rotate('+rotate+'deg)';
		}else if(flag == 2){
			getPullUpTip(that).querySelector('.ico').className = 'ico loading';
		}
		
		
	}

	function getPullUpTip(that){

		return that.wrapper.querySelector('.pullUpTip');
	}

	//判断是否可以上拉刷新
	function pullDownInit(scroll){
		allowPullDown = true;
		if(pullDownLoading[bdScroll.currentPage.pageX]) return;
		if(scrollStartY < -80){
			allowPullDown = false;
		}
		for(var i = 0; i<config.pullDown.except.length;i++){
			if(config.pullDown.except[i] == bdScroll.currentPage.pageX) allowPullDown = false;
		}
		if(!allowPullDown) {
			getPullDownTip(scroll).style.display = 'none';
			return;
		}

		noMore = scroll.scroller.getAttribute('noMore')?1:0;
		var nowtime = (new Date()).getTime();
		scrollStartTime = nowtime;
		
		lastUpdate = scroll.scroller.getAttribute('lastupdate') || nowtime;
		var disnow = parseInt( ( nowtime- lastUpdate)/1000 );

		if(noMore === 1 && disnow <= config.pullDown.nextTime){
			getPullDownTip(scroll).style.display = 'none';
			allowPullDown = false;
			scroll.scroller.setAttribute('noMore',0);
		}else{
			setPullDownTip(scroll,config.pullDown.contentDown);
			getPullDownTip(scroll).style.display = 'block';
			allowPullDown = true;
			var lastDate = new Date(parseInt(lastUpdate));
			var lastDateStr = (lastDate.getMonth()+1)+'/'+lastDate.getDate()+' '+lastDate.getHours()+':'+lastDate.getMinutes()+':'+lastDate.getSeconds();
			getPullDownTip(scroll).querySelector('.tip i').innerHTML = '最后刷新：'+lastDateStr;
		}
	}

	function pullUpInit(scroll){
		allowPullUp = true;
		if(scrollStartY > scroll.maxScrollY + 80) {
			allowPullUp = false;
			return;
		}
		if(pullUpLoading[bdScroll.currentPage.pageX]) return;

		for(var i = 0; i<config.pullUp.except.length;i++){
			if(config.pullUp.except[i] == bdScroll.currentPage.pageX) allowPullUp = false;
		}
		if(!allowPullUp) {
			getPullUpTip(scroll).style.display = 'none';
			return;
		}

		loadedAll = scroll.scroller.getAttribute('loadedAll')?1:0;
		if(loadedAll){
			getPullUpTip(scroll).style.display = 'none';
			allowPullUp = false;
		}else{
			getPullUpTip(scroll).style.display = 'block';
			setPullUpTip(scroll,config.pullUp.contentUp);
			allowPullUp = true;
		}

	}
	var isFast = true;
	function isFastScroll(){
		if(!isFast) return false;
		
		var nowtime = (new Date()).getTime();
		var dsTime = nowtime - scrollStartTime;
		if(dsTime > 200){
			isFast = false;
		}else{
			isFast = true;
		}
		return isFast;
	}

	function bdEndHandler(){
		var index = Math.abs(this.x)/bdWidth;
		tabsScroll.scrollToElement('#tab-scroll-warpper-'+index,700,true);
		document.getElementById(config.tabs).querySelector('.tab-scroller .active').className = '';
		document.getElementById('tab-scroll-warpper-'+index).className = 'active';
		if(config.slide){
			config.slide(bdScroll.currentPage.pageX);
		}
		bdScrolls[bdScroll.currentPage.pageX].enable();
		
	}
	var scrollMoving = false;
	function scrollStartHandler(){
		
		scrollMoving = false;
		bdMoving = false;
		scrollStartY = this.y;
		scrollStartX = bdScroll.x;
		pullDownInit(this);
		pullUpInit(this);
	}

	function scrollMoveHandler () {

		
		if(bdMoving) {
			this.disable();
			this.scrollTo(0,scrollStartY);
			return;
		}
		if(scrollMoving){
			bdScroll.disable();
			bdScroll.goToPage(bdScroll.currentPage.pageX,0);
		}
		if(!scrollMoving && !bdMoving){
			var moveX = Math.abs(bdScroll.x - scrollStartX);
			var moveY = Math.abs(this.y- scrollStartY);
			if(moveX > 5 || moveY > 5){
				if(moveX > moveY){
					bdMoving = true;
				}else{
					scrollMoving = true;
				}
			}
		}
		 //如果开启了
		
		if(isFastScroll()) return;

		if(allowPullDown){
			
			
			if(this.y>=pd_height && !pullDownStatus && this.directionY == -1){ 
				//如果下拉的高度大于等于设定的高度（默认60）
				pullDownStatus = true; //设置为可以下拉刷新 TODO 判断下如果已经没有更多新数据的时候 设置为false
				setPullDownTip(this,config.pullDown.contentHover);
				setRotate(this,1);
			}else if(this.y<pd_height && this.y >=0 ){
				//如果没到达到指定下拉距离的时候，设置旋转动画
				if(this.directionY === 1){ 
					//如果用户取消下拉刷新（实际操作：先拉下来然后手指不松开又拉上去）
					pullDownStatus = false;
				}
				if(!pullDownStatus){
					setRotate(this,0);
				}else{
					this.scroller.style.top = (pd_height-this.y)+'px';
				}
			}
		}

		if(allowPullUp){

			if(this.y <= (this.maxScrollY - pd_pullUpHeight) && !pullUpStatus && this.directionY == 1){
				pullUpStatus = true;
				setPullUpTip(this,config.pullUp.contentHover);
				setUpRotate(this,1);

			}else if(this.y > (this.maxScrollY - pd_pullUpHeight) && this.y < this.maxScrollY){
				if(this.directionY === -1){ 
					//如果用户取消上拉加载（实际操作：先拉上去然后手指不松开又拉下来）
					pullUpStatus = false;
					setUpRotate(this,0);
				}
				if(pullUpStatus){
					var toppx = this.maxScrollY - this.y - pd_pullUpHeight;
					this.scroller.style.top = toppx+'px';
				}
			}
		}


	}

	function scrollEndHandler(){
		bdScroll.enable();
		this.enable();
		bdMoving = false;
		var that = this;
		if(pullDownStatus){
			setPullDownTip(that,config.pullDown.contentRefresh);
			setRotate(this,2);
			var lastUpdateTime = that.scroller.getAttribute('lastupdate') || 0;
			var param = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				lastUpdate:lastUpdateTime,
			};
			//设置当前页面正在加载数据
			pullDownLoading[param.index] = true;
			pullDownAction(param);
			
		}else if(pullUpStatus){
			setPullUpTip(that,config.pullUp.contentRefresh);
			setUpRotate(that,2);
			var lastUpdateTime = that.scroller.getAttribute('lastupdate') || 0;
			var page = that.scroller.getAttribute('page');
			if(!page) page = 0;
			var param = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				lastUpdate:lastUpdateTime,
				page:parseInt(page)
			};
			pullUpLoading[param.index] = true;
			pullUpAction(param);

		}
		
	}

	this.pullDownCallBack = function(param,noMore){

		var scroll = param.scroll;
		
		pullDownStatus = false;
		scroll.refresh();
		pullDownLoading[param.index] = false;
		if(typeof(noMore) != 'undefined'){
			scroll.scroller.setAttribute('noMore','1');
			setPullDownTip(scroll,config.pullDown.contentNomore);
			setRotate(scroll,3);
			setTimeout(function(){
				setTop(scroll,0);
			},2000);
		}else{
			setPullDownTip(scroll,config.pullDown.contentDown);
			setRotate(scroll,0);
			setTop(scroll,0);
		}
		var now = (new Date()).getTime();
		scroll.scroller.setAttribute('lastupdate',now);
		
		
	}

	this.pullUpCallBack = function(param,loadedAll){

		var scroll = param.scroll;
		
		pullUpStatus = false;
		scroll.refresh();
		pullUpLoading[param.index] = false;

		var page = scroll.scroller.getAttribute('page');
		if(!page) page = 0;
		scroll.scroller.setAttribute('page',(parseInt(page)+1));
		

		if(typeof(loadedAll) != 'undefined'){
			scroll.scroller.setAttribute('loadedAll','1');
			setPullUpTip(scroll,config.pullUp.contentNomore);
			setUpRotate(scroll,3);
			setTimeout(function(){
				setTop(scroll,0);
				setUpRotate(scroll,0);
			},2000);
		}else{
			setPullUpTip(scroll,config.pullUp.contentUp);
			setTop(scroll,0);
			setUpRotate(scroll,0);
		}
		
		
	}
	function pullUpAction(param){

		if(typeof(_this.upAction) == 'function'){
			_this.upAction(param);
		}else{
			setTimeout(function(){
				_this.pullUpCallBack(param,1);
			},2000);
		}
	}
	function pullDownAction(param){
		if(typeof(_this.downAction) == 'function'){
			_this.downAction(param);
		}else{
			setTimeout(function(){
				_this.pullDownCallBack(param,1);
			},2000);
		}
		
	}

	//感谢cnblogs的Jun.lu 他的博客地址:http://home.cnblogs.com/u/idche/
	//http://www.cnblogs.com/idche/archive/2010/06/13/1758006.html
	var jelle=function(elem){
		var f=j=0,callback,_this={},//j动画总数
	    tween=function(t,b,c,d){return -c*(t/=d)*(t-2) + b};
	    //算子你可以改变他来让你的动画不一样
	    _this.execution=function(key,val,t){
	            var s=(new Date()).getTime(),d=t || 500,
	                b=parseInt(elem.style[key]) || 0,
	                c=val-b;
	                (function(){
	                    var t=(new Date()).getTime()-s;
	                    if(t>d){
	                        t=d;
	                        elem.style[key]=tween(t,b,c,d)+'px';
	                        //if(++f==j && callback){callback.apply(elem)}
	                        ++f==j&&callback&&callback.apply(elem);
	                        //这句跟上面注释掉的一句是一个意思，我在google压缩的时候发现了这句
	                        //感觉很不错。
	                        return _this;
	                    }
	                    elem.style[key]=tween(t,b,c,d)+'px';
	                    setTimeout(arguments.callee,10);
	                    //arguments.callee 匿名函数递归调用
	                })();
	            //只能写一个这个了。
	        };
	    _this.animate=function(sty,t,fn){
	        //sty,t,fn 分别为 变化的参数key,val形式,动画用时,回调函数
	            callback=fn;
	            //多key 循环设置变化
	            for(var i in sty){
	                    j++;//动画计数器用于判断是否所有动画都完成了。
	                    _this.execution(i,parseInt(sty[i]),t);
	                }
	        };
	    return _this;
	}

	function init(tab,bd,conf){
		config.tabs = tab;
		config.tabs_bd = bd;
		if(typeof(conf) != 'undefined'){
			if(typeof(conf.pullDown) != 'undefined'){
				config.pullDown.height = typeof(conf.pullDown.height) != 'undefined' ? conf.pullDown.height : config.pullDown.height;
				config.pullDown.nextTime = typeof(conf.pullDown.nextTime) != 'undefined' ? conf.pullDown.nextTime : config.pullDown.nextTime;
				config.pullDown.html = typeof(conf.pullDown.html) != 'undefined' ? conf.pullDown.html : config.pullDown.html;
				config.pullDown.except = typeof(conf.pullDown.except) != 'undefined' ? conf.pullDown.except : config.pullDown.except;
				config.pullDown.contentDown = typeof(conf.pullDown.contentDown) != 'undefined' ? conf.pullDown.contentDown : config.pullDown.contentDown;
				config.pullDown.contentHover = typeof(conf.pullDown.contentHover) != 'undefined' ? conf.pullDown.contentHover : config.pullDown.contentHover;
				config.pullDown.contentRefresh = typeof(conf.pullDown.contentRefresh) != 'undefined' ? conf.pullDown.contentRefresh : config.pullDown.contentRefresh;
				config.pullDown.contentNomore = typeof(conf.pullDown.contentNomore) != 'undefined' ? conf.pullDown.contentNomore : config.pullDown.contentNomore;
				config.pullDown.callback = typeof(conf.pullDown.callback) != 'undefined' ? conf.pullDown.callback : config.pullDown.callback;
				config.pullDown.animation = typeof(conf.pullDown.animation) != 'undefined' ? conf.pullDown.animation : config.pullDown.animation;
			}
			if(typeof(conf.pullUp) != 'undefined'){
				config.pullUp.height = typeof(conf.pullUp.height) != 'undefined' ? conf.pullUp.height : config.pullUp.height;
				config.pullUp.nextTime = typeof(conf.pullUp.nextTime) != 'undefined' ? conf.pullUp.nextTime : config.pullUp.nextTime;
				config.pullUp.html = typeof(conf.pullUp.html) != 'undefined' ? conf.pullUp.html : config.pullUp.html;
				config.pullUp.except = typeof(conf.pullUp.except) != 'undefined' ? conf.pullUp.except : config.pullUp.except;
				config.pullUp.contentUp = typeof(conf.pullUp.contentUp) != 'undefined' ? conf.pullUp.contentUp : config.pullUp.contentUp;
				config.pullUp.contentHover = typeof(conf.pullUp.contentHover) != 'undefined' ? conf.pullUp.contentHover : config.pullUp.contentHover;
				config.pullUp.contentRefresh = typeof(conf.pullUp.contentRefresh) != 'undefined' ? conf.pullUp.contentRefresh : config.pullUp.contentRefresh;
				config.pullUp.contentNomore = typeof(conf.pullUp.contentNomore) != 'undefined' ? conf.pullUp.contentNomore : config.pullUp.contentNomore;
				config.pullUp.callback = typeof(conf.pullUp.callback) != 'undefined' ? conf.pullUp.callback : config.pullUp.callback;
				config.pullUp.animation = typeof(conf.pullUp.animation) != 'undefined' ? conf.pullUp.animation : config.pullUp.animation;
			}
		}
		
		createScroll();
	}

	init(tab_id,bd_id,parames);
	this.upAction = config.pullUp.callback;
	this.downAction = config.pullDown.callback;
	this.upAnimation = config.pullUp.animation;
	this.downAnimation = config.pullDown.animation;

	this.refresh = function(index){
		bdScrolls[index].refresh();
	}
	this.setPage = function(index,page){
		if(typeof(page) != 'number') page = 1;
		bdScrolls[index].scroller.setAttribute('page',page);
	}
	this.setNoMore = function(index){
		bdScrolls[index].scroller.setAttribute('nomore',1);
	}
	this.setLoadedAll = function(index){
		bdScrolls[index].scroller.setAttribute('loadedAll',1);
	}
	this.slide = function(fn,runNow){
		config.slide = fn;
		if(typeof(runNow) == 'undefined'){
			fn(bdScroll.currentPage.pageX);
		}
		
	}
	this.bdScroll = bdScroll;
	return this;

}

