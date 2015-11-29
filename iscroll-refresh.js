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
			callback:null, //回调函数
			animation:null, //自定义动画函数
			tip:null //自定义提示函数
		},
		pullUp:{
			height:40,
			html:'<span class="ico"></span><span class="tip">上拉加载更多</span>',
			except:[],
			contentUp:'上拉加载更多...',
			contentHover:'释放立即加载...',
			contentRefresh:'正在加载...',
			contentNomore:'没有更多数据了...',
			callback:null, //回调函数
			animation:null, //自定义动画函数
			tip:null //自定义提示函数
		},
		tabs:'tabs',
		tabs_bd:'tabs-bd',
		slide:null
	};
	var _this = this;
    _this.pageX = 0;
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
	var bdWidth,bdHeight;
	var bdScrolls = [];
	var bdMoving = false;  //是否在横向滚动
	var scrollMoving = false; //是否在上下滚动
	var scrollStartY,scrollStartX,scrollStartTime,noMore,lastUpdate,allowPullDown,allowPullUp,loadedAll;
	var downTipClassName = 'ir-down-tip',upTipClassName = 'ir-up-tip'

	function createScroll(){

		/*计算选项卡的宽度并初始化scroll*/
		
		tabElements = _this.tabScroller.children;
		var tabWidth = 0,tagName;
		for(var i = 0; i<tabElements.length;i++){
			tabWidth += tabElements[i].offsetWidth;
			tabElements[i].style.width = tabElements[i].offsetWidth+'px';
			tagName = tabElements[i].tagName;
		}
		tabWidth+=1;
		_this.tabScroller.style.width = tabWidth+'px';
		tabsScroll = new IScroll(_this.tabWrapper, { scrollX: true, scrollY:false, snap:tagName, tap:true });

		var swiper = _this.bdWrapper.children[0];
		bdWidth = _this.bdWrapper.offsetWidth;
		bdHeight = _this.bdWrapper.offsetHeight;
		var warppers = swiper.children;
		
		swiper.style.width = bdWidth*warppers.length + 'px';

		for(i = 0; i<warppers.length;i++){
			warppers[i].style.width = bdWidth+'px';
			warppers[i].style.height = bdHeight+'px';
			warppers[i].children[0].style.minHeight = bdHeight + 'px';
			bdScrolls[i] = new IScroll(warppers[i], { probeType: 3, tap:true});

			//添加下拉刷新DIV
			var pullDownDiv = document.createElement('div');
			pullDownDiv.className = downTipClassName;
			pullDownDiv.innerHTML = pullDownHtml;
			warppers[i].appendChild(pullDownDiv);

			//添加上拉加载DIV
			var pullUpDiv = document.createElement('div');
			pullUpDiv.className = upTipClassName;
			pullUpDiv.innerHTML = pullUpHtml;
			warppers[i].appendChild(pullUpDiv);
			
			//绑定iscroll事件
			bdScrolls[i].on('scrollStart', scrollStartHandler);
			bdScrolls[i].on('scroll', scrollMoveHandler);
			bdScrolls[i].on('scrollEnd', scrollEndHandler);

			//设置正在加载标识为false
			pullDownLoading[i] = false;
			pullUpLoading[i] = false;
		}

		bdScroll = new IScroll(_this.bdWrapper, { scrollX: true, scrollY:false, momentum: false, snap:true });
		
		bdScroll.on('scrollEnd',bdEndHandler);

		initTab();

	}
	_this.index = function(current, obj){ 
		for (var i = 0; i < obj.length; i++) { 
			if (obj[i] == current) { 
				return i; 
			} 
		} 
	} 
	//初始化点击选项卡的事件
	function initTab(){
		for(var i = 0; i<tabElements.length;i++){
			tabElements[i].addEventListener('tap',function(event){
				event.preventDefault();
				var target = event.target || event.srcElement;
				var index = _this.index(target,tabElements);
				bdScroll.goToPage(parseInt(index),0,500);
			},false)
		}
		
	}


	function setTop(scroll,num){
		//设置滚动scroller回到顶部
		jelle(scroll.scroller).animate({top:num+'px'},500);
	}

	function setPullDownTip(scroll,tip){
		//设置下拉刷新提示 TODO 自定义下拉刷新提示方法
		if(typeof(_this.downTip) == 'function'){
			var parame = {
				scroll:scroll,
				index:bdScroll.currentPage.pageX,
				ele:getPullDownTip(scroll),
				tip:tip
			};
			_this.downTip(parame);
			return;
		};
		getPullDownTip(scroll).querySelector('.tip b').innerHTML = tip;
	}

	function setRotate(scroll,flag){
		//设置下拉刷新旋转动画
		if(_this.downAnimation){
			//如果自定义了旋转动画 则调用自定义的旋转动画
			var parame = {
				scroll:scroll,
				index:bdScroll.currentPage.pageX,
				ele:getPullDownTip(scroll),
				status:flag
			}
			_this.downAnimation(param);
			return;
		};
		if(flag == 0){
			var rotate = scroll.y/pd_height*180;
			getPullDownTip(scroll).querySelector('.ico i').style.transform = 'rotate('+rotate+'deg)';
		}
	}

	function getPullDownTip(scroll){
		return scroll.wrapper.querySelector('.'+downTipClassName);
	}

	function setPullUpTip(scroll,tip){
		//设置下拉刷新提示 TODO 自定义下拉刷新提示方法
		if(typeof(_this.upTip) == 'function'){
			var parame = {
				scroll:scroll,
				index:bdScroll.currentPage.pageX,
				ele:getPullUpTip(scroll),
				tip:tip
			};
			_this.upTip(parame);
			return;
		};
		getPullUpTip(scroll).querySelector('.tip').innerHTML = tip;
	}
	//上拉刷新动画
	function setUpRotate(scroll,flag){
		if(_this.upAnimation){
			//如果自定义了上拉刷新动画，则调用自定义的函数
			var parame = {
				scroll:scroll,
				index:bdScroll.currentPage.pageX,
				ele:getPullUpTip(scroll),
				status:flag
			}
			_this.upAnimation(param);
			return;
		}

		//默认旋转动画
		var rotate = 180;
		if(flag == 0){
			getPullUpTip(scroll).querySelector('.ico').className = 'ico';
			getPullUpTip(scroll).querySelector('.ico').style.transform = 'rotate('+rotate+'deg)';
		}else if(flag == 1){
			rotate = 0;
			getPullUpTip(scroll).querySelector('.ico').className = 'ico';
			getPullUpTip(scroll).querySelector('.ico').style.transform = 'rotate('+rotate+'deg)';
		}else if(flag == 2){
			getPullUpTip(scroll).querySelector('.ico').className = 'ico loading';
		}
		
		
	}

	function getPullUpTip(scroll){

		return scroll.wrapper.querySelector('.'+upTipClassName);
	}

	//判断是否可以上拉刷新
	function pullDownInit(scroll){
		allowPullDown = true;
		//如果当前页面正在刷新中...
		if(pullDownLoading[bdScroll.currentPage.pageX]) return;
		getPullDownTip(scroll).style.display = 'none'; //先隐藏掉
		//如果当前页面已经滚动的距离超过了80（防止快速滚动导致上拉刷新问题）
		if(scrollStartY < -80){
			allowPullDown = false;
			return;
		}
		//判断此滚动是否设置了不允许上拉刷新
		for(var i = 0; i<config.pullDown.except.length;i++){
			if(config.pullDown.except[i] == bdScroll.currentPage.pageX) {
				allowPullDown = false;
				return;
			}
		}
		

		noMore = scroll.scroller.getAttribute('noMore')?1:0; //是否可以继续刷新

		/*判断当前时间和最后更新时间*/
		var nowtime = (new Date()).getTime();
		scrollStartTime = nowtime;
		
		lastUpdate = scroll.scroller.getAttribute('lastupdate') || nowtime;
		var disnow = parseInt( ( nowtime- lastUpdate)/1000 );

		if(noMore === 1 && disnow <= config.pullDown.nextTime){
			//如果设置了不能刷新并且设置没有过期
			allowPullDown = false;
			return;
		}

		getPullDownTip(scroll).style.display = 'block';
		//如果可以刷新的情况
		if(noMore == 1) scroll.scroller.setAttribute('noMore',0); //设置为可以刷新
		setPullDownTip(scroll,config.pullDown.contentDown);//设置正在刷新文字
		allowPullDown = true;
		//设置最后更新时间
		var lastDate = new Date(parseInt(lastUpdate));
		var lastDateStr = (lastDate.getMonth()+1)+'/'+lastDate.getDate()+' '+lastDate.getHours()+':'+lastDate.getMinutes()+':'+lastDate.getSeconds();
		getPullDownTip(scroll).querySelector('.tip i').innerHTML = '最后刷新：'+lastDateStr;
	}

	//判断是否可以下拉加载
	function pullUpInit(scroll){
		allowPullUp = true;
		//正在加载中...
		if(pullUpLoading[bdScroll.currentPage.pageX]) return;

		getPullUpTip(scroll).style.display = 'none';
		//当前滚动距离到底部超过了 80 则设置为不能上拉加载
		if(scrollStartY > scroll.maxScrollY + 80) {
			allowPullUp = false;
			return;
		}
		for(var i = 0; i<config.pullUp.except.length;i++){
			if(config.pullUp.except[i] == bdScroll.currentPage.pageX) {
				allowPullUp = false;
				return;
			}
		}
		
		//如果已经全部加载完成，则不再显示上拉加载
		loadedAll = scroll.scroller.getAttribute('loadedAll')?1:0;
		if(loadedAll){
			allowPullUp = false;
			return;
		}
		getPullUpTip(scroll).style.display = 'block';
		setPullUpTip(scroll,config.pullUp.contentUp);

	}
	var isFast = true;
	function isFastScroll(){
		if(!isFast) return false; //拉动时间已经超过了200ms的情况
		var nowtime = (new Date()).getTime();
		var dsTime = nowtime - scrollStartTime;
		if(dsTime > 200){ //如果拉动的时间小于200ms 则判断为快速刷新
			isFast = false;
		}else{
			isFast = true;
		}
		return isFast;
	}

	function bdEndHandler(){
		var  index = _this.pageX = this.currentPage.pageX;
		//选项卡滚动到当前索引的位置
		tabsScroll.scrollToElement(_this.tabScroller.children[index],700,true); 
		//设置class
		_this.tabScroller.querySelector('.active').className = '';
		_this.tabScroller.children[index].className = 'active';
		//如果定义了滑动函数
		if(_this.slideAction){
			_this.slideAction(bdScroll.currentPage.pageX);
		}
		//启用当前页面的上下滚动（在滑动的时候是禁止上下滚动的，所以这里滑动完成后要启用）;
		bdScrolls[bdScroll.currentPage.pageX].enable();
		
	}

	
	function scrollStartHandler(){
		//初始化上下滚动和左右滑动标志位
		scrollMoving = false;
		bdMoving = false;

		scrollStartY = this.y;
		scrollStartX = bdScroll.x;
		//设置是否可以上拉刷新或下拉加载
		pullDownInit(this);
		pullUpInit(this);
	}

	function scrollMoveHandler () {
		/*
		//如果是左右滑动，则禁止上下滚动，并将页面还原到滚动前高度
		if(bdMoving) {
			this.disable();
			this.scrollTo(0,scrollStartY);
			return;
		}
		//如果是上下滚动 则禁止左右滚动，并将页面还原到滑动前的状态
		if(scrollMoving){
			bdScroll.disable();
			bdScroll.goToPage(bdScroll.currentPage.pageX,0);
		}
		*/
		//如果没有判断出是左右滑动还是上下滚动的情况

		//如果是快速滑动
		if(isFastScroll()) return;

		//判断左右滑动还是上下滚动的情况
		if(!scrollMoving && !bdMoving){
			var moveX = Math.abs(bdScroll.x - scrollStartX); //左右移动的距离
			var moveY = Math.abs(this.y- scrollStartY); //上下移动的距离
			//如果移动的距离大于5（无论是上下还是左右）
			if(moveX > 5 || moveY > 5){
				if(moveX > moveY){ 
					//左右移动距离比上下移动距离大，则禁止上下滚动，并将页面还原到滚动前高度
					this.disable();
					this.scrollTo(0,scrollStartY);
					bdMoving = true;
					return;
				}else{
					//禁止左右滚动，并将页面还原到滑动前的状态
					bdScroll.disable();
					bdScroll.goToPage(bdScroll.currentPage.pageX,0);
					scrollMoving = true;
				}
			}
		}
		

		if(allowPullDown){
			
			//允许下拉刷新的情况
			if(this.y>=pd_height && !pullDownStatus && this.directionY == -1){ 
				//如果下拉的高度大于等于设定的高度（默认60）并且滑动方向是向下的
				pullDownStatus = true; //设置为可以下拉刷新 
				setPullDownTip(this,config.pullDown.contentHover); //设置提示（默认：松开刷新)
				setRotate(this,1); //旋转动画设置
			}else if(this.y<pd_height && this.y >=0 ){
				//如果没到达到指定下拉距离的时候，设置旋转动画
				if(this.directionY === 1){ 
					//如果用户取消下拉刷新（实际操作：先拉下来然后手指不松开又拉上去）
					setPullDownTip(this,config.pullDown.contentDown);
					pullDownStatus = false;
				}
				if(!pullDownStatus){
					setRotate(this,0); //设置动画
				}else{
					//如果是下拉刷新的情况，则设置scroller的top递增
					this.scroller.style.top = (pd_height-this.y)+'px';
				}
			}
		}

		if(allowPullUp){
			
			//允许上拉加载的情况
			if(this.y <= (this.maxScrollY - pd_pullUpHeight) && !pullUpStatus && this.directionY == 1){
				pullUpStatus = true;
				setPullUpTip(this,config.pullUp.contentHover);
				setUpRotate(this,1);

			}else if(this.y > (this.maxScrollY - pd_pullUpHeight) && this.y < this.maxScrollY){
				if(this.directionY === -1){ 
					//如果用户取消上拉加载（实际操作：先拉上去然后手指不松开又拉下来）
					pullUpStatus = false;
					setPullUpTip(this,config.pullUp.contentUp);
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
		bdScroll.enable(); //启用左右滑动
		var that = this;
		if(pullDownStatus){
			//如果是上拉刷新
			setPullDownTip(that,config.pullDown.contentRefresh); //设置提示
			setRotate(this,2); //设置动画
			var lastUpdateTime = that.scroller.getAttribute('lastupdate'); //最后更新时间
			if(!lastUpdateTime) lastUpdateTime = 0;
			var param = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				lastUpdate:parseInt(lastUpdateTime),
			};
			//设置当前页面正在加载数据
			pullDownLoading[param.index] = true;
			pullDownAction(param);
			
		}else if(pullUpStatus){
			//下拉加载
			setPullUpTip(that,config.pullUp.contentRefresh);
			setUpRotate(that,2);
			var lastUpdateTime = that.scroller.getAttribute('lastupdate');
			if(!lastUpdateTime) lastUpdateTime = 0;
			var page = that.scroller.getAttribute('page'); //已经加载的页数
			if(!page) page = 0;
			var param = {
				scroll:that,
				index:bdScroll.currentPage.pageX,
				lastUpdate:parseInt(lastUpdateTime),
				page:parseInt(page)
			};
			pullUpLoading[param.index] = true;
			pullUpAction(param);

		}
		
	}

	this.pullDownCallBack = function(param,noMore){

		var scroll = param.scroll;
		pullDownStatus = false;
		pullDownLoading[param.index] = false; //设置正在刷新为false
		if(typeof(noMore) != 'undefined'){ //如果传入了第二个参数，则设置为没有更多新数据了
			scroll.scroller.setAttribute('noMore','1');
			setPullDownTip(scroll,config.pullDown.contentNomore);
			setRotate(scroll,3);
			setTimeout(function(){
				setTop(scroll,0);
				scroll.refresh();
			},1000);
		}else{
			setTimeout(function(){
				setPullDownTip(scroll,config.pullDown.contentDown);
				setRotate(scroll,0);
				setTop(scroll,0);
				scroll.refresh();
			},1000);
		}
		var now = (new Date()).getTime();
		scroll.scroller.setAttribute('lastupdate',now);
		
	}

	this.pullUpCallBack = function(param,loadedAll){

		var scroll = param.scroll;
		
		pullUpStatus = false;
		pullUpLoading[param.index] = false;

		//加一页
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
				scroll.refresh();
			},1000);
		}else{
			setTimeout(function(){
				setPullUpTip(scroll,config.pullUp.contentUp);
				setUpRotate(scroll,0);
				setTop(scroll,0);
				setUpRotate(scroll,0);
				scroll.refresh();
			},1000);
		}
		
		
	}

	function pullUpAction(param){
		if(typeof(_this.upAction) == 'function'){
			_this.upAction(param);
		}else{
			setTimeout(function(){
				_this.pullUpCallBack(param,1);
			},1000);
		}
	}
	function pullDownAction(param){
		if(typeof(_this.downAction) == 'function'){
			_this.downAction(param);
		}else{
			setTimeout(function(){
				_this.pullDownCallBack(param,1);
			},1000);
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
		_this.tabWrapper = typeof tab == 'string' ? document.querySelector(tab) : tab;
		_this.tabScroller = _this.tabWrapper.children[0];
		_this.bdWrapper = typeof bd == 'string' ? document.querySelector(bd) : bd;
		_this.bdScroller = _this.bdWrapper.children[0];

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
	this.upTip = config.pullUp.tip;
	this.downTip = config.pullDown.tip;
	this.slideAction = config.slide;
	this.config = config;

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
	this.getDownTip = function(index){
		return getPullDownTip(bdScrolls[index]);
	}
	this.getUpTip = function(){
		return getPullUpTip(bdScrolls[index]);
	}
	this.slide = function(fn,runNow){
		config.slide = fn;
		if(typeof(runNow) == 'undefined'){
			fn(bdScroll.currentPage.pageX);
		}
	}
	this.bdScroll = bdScroll;
	this.bdScrolls = bdScrolls;
	this.tabScroll = tabsScroll;
	return this;
}

//偷懒的自动生成选项卡
function IR(ary,len){
	var tabsHtml = '';
	var tabsStyle = '';
	var bdHtml = '';
	var loadHtml = '<div class="loader"><div class="line-scale"><div></div><div></div><div></div><div></div><div></div></div><div style="margin-top:15px">加载中...</div></div>';
	if(typeof(len) != 'undefined'){
		tabsStyle = 'style="width:'+(100/len)+'%"';
	}
	for(var i = 0;i<ary.length;i++){
		if(i===0) tabsHtml += '<a href="javascript:" class="active" '+tabsStyle+'>'+ary[i]+'</a>';
		else tabsHtml += '<a href="javascript:" '+tabsStyle+'>'+ary[i]+'</a>';
		bdHtml += '<div class="ir-wrapper" ><div class="ir-scroller" >'+loadHtml+'</div></div>';
	}
	var html = '<div id="ir-tabs-wrapper"><div class="ir-tabs-scroller">'+tabsHtml+'</div></div><div style="clear:both"></div><div id="ir-bd-wrapper"><div class="ir-bd-scroller">'+bdHtml+'</div></div>';
	document.body.innerHTML = html;
	return (new iScrollRefresh('#ir-tabs-wrapper','#ir-bd-wrapper'));
}

