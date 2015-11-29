# iscroll5 多选项卡+上拉刷新+下拉加载
## 效果
![](https://github.com/Mueat/iscroll-refresh/raw/master/demo/demo1.png)
![](https://github.com/Mueat/iscroll-refresh/raw/master/demo/demo2.png)
## HTML
```html
<div id="tabs">
	<div class="tab-scroller">
		<a class="active" href="#">选项卡1</a>
		<a href="#">选项卡2</a>
		<a href="#">选项卡3</a>
		<a href="#">选项卡4</a>
		<a href="#">选项卡5</a>
		<a href="#">选项卡6</a>
	</div>
</div>
<div id="tabs-bd">
	<div class="tabs-bd-scroller">
		<div class="wrapper" >
			<div class="scroller"> 
			<!--这里是内容区域--> <ul><li>...</li></ul>
			</div>
		</div>
		<div class="wrapper" ><div class="scroller"> <ul><li>...</li></ul></div>
	  <div class="wrapper" ><div class="scroller"> <ul><li>...</li></ul></div>
	  <div class="wrapper" ><div class="scroller"> <ul><li>...</li></ul></div>
	  <div class="wrapper" ><div class="scroller"> <ul><li>...</li></ul></div>
	</div>
</div>
```
###JS调用
```javascript
  var ir = new iScrollRefresh('tabs','tabs-bd'); //第一个参数为选项卡容器ID 第二个为滚动容器  第三个参数可选参数（见下面可选配置）
	ir.upAction = pullUp; //上拉刷新的处理函数
	ir.downAction = pullDown; //下拉加载的处理函数
```

### 可选配置

```javascript
var config = {
	//上拉刷新配置项
	pullDown:{ 
		height:60, //拉动多少像素后启动上拉刷新
		nextTime:3600, //当没有更新的数据后，间隔多少时间才能再次下拉刷新，单位：秒
		html:'<span class="ico"><i></i></span><span class="tip"><b>下拉刷新...</b><i></i></span>', //上拉刷新html
		except:[], //不使用上拉刷新的索引，如传入[0,1] 则第一个和第二个选项卡下面的滚动没有上拉刷新
		contentDown:'下拉刷新...',
		contentHover:'释放立即刷新...',
		contentRefresh:'正在刷新...',
		contentNomore:'没有更多新数据了...',
		callback:null, //上拉刷新处理函数 和 ir.upAction 一样
		animation:null, //动画处理函数 和 ir.upAnimation 一样
		tip:null //自定义提示函数，如果不设置这个函数则插件默认根据上面的提示语来改变提示
	},
	//下拉加载配置项
	pullUp:{
		height:40, //拉动多少像素后启动下拉加载
		html:'<span class="ico"></span><span class="tip">上拉加载更多</span>', //下拉加载提示 html
		except:[], //不使用下拉加载的索引，和上面一样
		contentUp:'上拉加载更多...',
		contentHover:'释放立即加载...',
		contentRefresh:'正在加载...',
		contentNomore:'没有更多数据了...',
		callback:null, //处理函数
		animation:null, //动画函数
		tip:null //自定义提示函数，如果不设置这个函数则插件默认根据上面的提示语来改变提示
	}
};

//使用自定义配置
var ir = new iScrollRefresh('tabs','tabs-bd',config);
```

### 处理函数说明

- 下拉刷新和上拉加载的回调方法中都会传入一个参数过来
- 使用pullDownCallBack方法来隐藏下拉刷新的提示
- 使用pullUpCallBack方法隐藏上拉加载的提示

```javascript

ir.upAction = pullUp; //定义下拉刷新回调函数
function pullUp(options){
	/*
	控件会把options参数传过来
	options.scroll  当前滚动的ISCROLL对象
	options.index   当前选项卡的索引，从0开始
	options.lastUpdate 上一次刷新的时间
	*/

	var index = options.index,lastUpdate = options.lastUpdate;
	var url = 'www.xxx.com/aticels'
	$.getJSON(url, {lastUpdate: lastUpdate}, function(json, textStatus) {
		if(json.code == 200){
			$('ul li').prepend(parseHtml(json.data));
			//关闭下拉刷新提示
			ir.pullDownCallBack(param); //如果不屏蔽下拉刷新，则第二个参数不要传
		}else{
			ir.pullDownCallBack(param,1); //如果屏蔽下拉刷新，则传第二个参数进去
		}
	});
}

ir.downAction = pullDown; //定义上拉加载的回调函数
function pullDown(options){
	/*
	控件会把options参数传过来
	options.scroll  当前滚动的ISCROLL对象
	options.index   当前选项卡的索引，从0开始
	options.lastUpdate 上一次刷新的时间
	options.page 当前已经加载的页数
	*/

	var index = options.index,lastUpdate = options.lastUpdate,page=options.page;
	var url = 'www.xxx.com/aticels'
	$.getJSON(url, {page: page,lastUpdate:lastUpdate}, function(json, textStatus) {
		if(json.code == 200){
			$('ul li').append(parseHtml(json.data));
			//关闭下拉刷新提示
			ir.pullUpCallBack(param); //如果还有更多数据，则第二个参数不要传
		}else{
			ir.pullUpCallBack(param,1); //如果没有更多数据的时候，传入第二个参数，屏蔽上拉加载
		}
	});
}

```

## 方法汇总

```javascript

ir.upAction = function(){...} // 设置上拉刷新处理方法
ir.downAction = function(){...}  // 设置下拉加载的方法
ir.upAnimation  = function(options){...} //设置上拉刷新动画
ir.downAnimation =function(options){...} //设置下拉加载动画
/* options说明
scroll:当前iscroll控件对象
index:当前选项卡索引
downTip:上拉刷新的div/下拉加载的div
status:当前状态 0 下拉刷新/下拉加载  1 松开刷新/松开加载 2 刷新中/加载中 3 没有更多数据
*/

ir.upTip = function(options){...} //设置上拉刷新提示
ir.downTip = function(options){...} //设置下拉加载提示
/* options说明
var options = {
	scroll:当前iscroll空间对象
	index:当前页面索引
	ele:提示所在dom节点
	tip:提示语
};
*/
ir.slideAction = function(index){...} //设置滑动处理方法 index:当前页面索引
ir.config //配置

ir.refresh(index) //刷新index索引下的iscroll控件
ir.setPage(index,page) //设置index索引下加载的页数
ir.setNoMore(index) //设置index索引没有更多新数据 （下拉刷新没有新数据的情况）
ir.setLoadedAll(index) //设置index索引没有更多数据（上拉加载后全部数据都加载完成的情况）
ir.slide(function(index){...},true) //选项卡切换后回调函数 index为切换后的索引，第二参数如果传了则立即执行第一个function

ir.getDownTip(index) //返回指定索引的上拉提示dom节点
ir.getUpTip(index) //返回指定索引的下拉提示dom节点
ir.bdScroll //返回选项卡内容的iscroll控件对象
ir.bdScrolls //返回上下滚动的iscroll控件对象数组
ir.tabScroll //返回选项卡的iscroll控件
```

## 懒人方法

```
var ir = IR(array,length);
// array传入选项卡的名称数组 如：['选项卡1','选项卡2','选项卡3','选项卡4','选项卡5','选项卡6'];
// length 表示在可视屏幕内显示多少个选项卡，如设置为4，则选项卡5和6则需要滑动才能看到
```














