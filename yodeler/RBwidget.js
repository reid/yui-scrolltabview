/*
Copyright 2008 Reid Burke <me@reidburke.com>
Code licensed under the BSD License: http://internal.reidburke.com/yui-addons/license.txt
*/

YAHOO.namespace('RBwidget');

(function() { // ScrollTabView

	YAHOO.RBwidget.ScrollTabView = function (el, attr) {
		YAHOO.RBwidget.ScrollTabView.superclass.constructor.call(this, el, attr); 
	}

	YAHOO.lang.extend(YAHOO.RBwidget.ScrollTabView, YAHOO.widget.TabView);

	var proto = YAHOO.RBwidget.ScrollTabView.prototype;
	var Dom = YAHOO.util.Dom;

	proto.contentTransition = function(newTab, oldTab) {
		var width, px, dims, ani;
		switch (this.get('direction')) {
			case 'horizontal':
				px = this.get('width') * this.getTabIndex(newTab);
				dims = [px, 0];
			break;
			case 'vertical':
				px = this.get('height') * this.getTabIndex(newTab);
				dims = [0, px]
			break;
		}
		newTab.set('contentVisible', true);
		ani = new YAHOO.util.Scroll(this._contentParent,
			{ scroll: { to: dims } }, 1,
			YAHOO.util.Easing.easeBothStrong
		);
		ani.onComplete.subscribe(function() {
			oldTab.set('contentVisible', false);
			oldTab.get('contentEl').style.display = 'block';
		});
		ani.animate();
	}

	proto.addTab = function(tab, index) {
		YAHOO.RBwidget.ScrollTabView.superclass.addTab.call(this, tab, index);
		_initTabStyle.call(this);
	}

	proto.removeTab = function(tab, index) {
		YAHOO.RBwidget.ScrollTabView.superclass.removeTab.call(this, tab, index);
		_initTabStyle.call(this);
	}

	proto.initAttributes = function(attr) {

		YAHOO.RBwidget.ScrollTabView.superclass.initAttributes.call(this, attr);

		this.setAttributeConfig('width', {
			value: attr.width,
			method: _initTabStyle.call(this)
		});
		this.setAttributeConfig('height', {
			value: attr.height,
			method: _initTabStyle.call(this)
		});
		this.setAttributeConfig('direction', {
			value: attr.direction,
			method: _initTabStyle.call(this)
			// todo validator for only horizontal, vertical
		});

		// todo easing
		// todo duration

		this.addListener('activeTabChange', function(ev) {
			var activeTab = this.get('activeTab');
			if (ev.newValue && !(activeTab && ev.newValue != activeTab)) {
				this.contentTransition(ev.newValue, activeTab);
			}
		});

		_initTabStyle.call(this);
	}

	var _initTabStyle = function() {

		var width = this.get('width');
		var height = this.get('height');
		var direction = this.get('direction');

		if (!width || !height || !direction) return false; // wait until all Attributes are set

		var tabs = this.get('tabs');

		Dom.setStyle(this._contentParent, 'overflow', 'hidden');
		Dom.setStyle(this._contentParent, 'position', 'relative');
		Dom.setStyle(this._contentParent, 'width', width + 'px');
		Dom.setStyle(this._contentParent, 'height', height + 'px');

		for (var i = 0, length = tabs.length; i < length; ++i) {

			var contentElement = tabs[i].get('contentEl');

			contentElement.style.display = 'block';

			Dom.setStyle(contentElement, 'position', 'absolute');
			
			switch (direction) {
				case 'horizontal':
					Dom.setStyle(contentElement, 'top', '0');
					Dom.setStyle(contentElement, 'left', (width * i) + 'px');
					Dom.setStyle(contentElement, 'width', width + 'px');
					break;
				case 'vertical':
					Dom.setStyle(contentElement, 'left', '0');
					Dom.setStyle(contentElement, 'top', (height * i) + 'px');
					Dom.setStyle(contentElement, 'height', height + 'px');
					break;
			}

		}

	}

})();
