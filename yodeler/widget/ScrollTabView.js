/*
yodeler YUI Addons - widget.ScrollTabView
Copyright 2008 Reid Burke <me@reidburke.com>
Code licensed under the BSD License: http://internal.reidburke.com/yui-addons/license.txt
*/

/**
 * An extension of TabView that transitions between tabs using a Scroll Animation.
 * 
 * @namespace YAHOO.yodeler.widget
 * @module ScrollTabView
 * @requires yahoo, event, dom, anim, tabview
 * @author Reid Burke <me@reidburke.com>
 * @version 0.1
 */

YAHOO.namespace('yodeler.widget');

(function() {

	/**
	 * @constructor
	 * @extends YAHOO.widget.TabView
	 * @param {HTMLElement | String | Object} el (optional) The html 
	 * element that represents the ScrollTabView, or the attribute 
	 * object to use. 
	 * An element will be created if none provided.
	 * @param {Object} attr (optional) A key map of ScrollTabView's 
	 * initial attributes. Ignored if first arg is attributes object.
	 */	
	YAHOO.yodeler.widget.ScrollTabView = function(el, attr) {
		YAHOO.yodeler.widget.ScrollTabView.superclass.constructor.call(this, el, attr); 
	}

	YAHOO.lang.extend(YAHOO.yodeler.widget.ScrollTabView, YAHOO.widget.TabView);

	// Shorthand
	var proto = YAHOO.yodeler.widget.ScrollTabView.prototype,
		Event = YAHOO.util.Event,
		Dom = YAHOO.util.Dom;

	// Events
	proto._prevElementStateHandlerEvent = null;
	proto._nextElementStateHandlerEvent = null;

	// Previous and Next elements
	proto._prevElementEnabled = false;
	proto._nextElementEnabled = false;

	/**
	 * Overrides default contentTransition with a transition
	 * that animates between Tab views.
	 *
	 * @method contentTransition
	 * @param {YAHOO.widget.Tab} newTab
	 * @param {YAHOO.widget.Tab} oldTab
	 * @return void
	 */
	proto.contentTransition = function(newTab, oldTab) {
		var px, dims, ani;
		if (_isVertical.call(this)) {
			px = this.get('height') * this.getTabIndex(newTab);
			dims = [0, px];
		} else {
			px = this.get('width') * this.getTabIndex(newTab);
			dims = [px, 0];
		}
		newTab.set('contentVisible', true);
		ani = new YAHOO.util.Scroll(this._contentParent,
			{ scroll: { to: dims } },
			this.get('duration'),
			this.get('easing')
		);
		ani.onComplete.subscribe(function() {
			oldTab.set('contentVisible', false);
			// Keep content visible for effect during transitions
			oldTab.get('contentEl').style.display = 'block';
		});
		ani.animate();
	}

	/**
	 * Adds a Tab to the ScrollTabView.  
	 * If no index is specified, the tab is added to the end of the tab list.
	 * 
	 * @method addTab
	 * @param {YAHOO.widget.Tab} tab A Tab instance to add.
	 * @param {Integer} index The position to add the tab. 
	 * @return void
	 */
	proto.addTab = function(tab, index) {
		YAHOO.yodeler.widget.ScrollTabView.superclass.addTab.call(this, tab, index);
		_computeStyle.call(this);
	}

	/**
	 * Removes the specified Tab from the ScrollTabView.
	 *
	 * @method removeTab
	 * @param {YAHOO.widget.Tab} item The Tab instance to be removed.
	 * @return void
	 */
	proto.removeTab = function(tab) {
		YAHOO.yodeler.widget.ScrollTabView.superclass.removeTab.call(this, tab);
		_computeStyle.call(this);
	}

	/**
	 * Set the activeTab property based on an its position
	 *
	 * @method setActiveTabIndex
	 * @param {Integer} idx The position to become active
	 */
	proto.setActiveTabIndex = function(idx) {
		return this.set('activeTab', this.getTab(idx));
	}

	/**
	 * Get the activeTab's position
	 *
	 * @method getActiveTabIndex
	 * @return {Integer} idx The tab's position
	 */
	proto.getActiveTabIndex = function() {
		return this.getTabIndex(this.get('activeTab'));
	}

	/**
	 * Go to the previous tab
	 *
	 * @method previousTab
	 * @return void
	 */
	proto.previousTab = function() {
		var dst = this.getActiveTabIndex() - 1;
		if (_checkPrevBounds(dst))
			this.setActiveTabIndex(dst);	
	}

	/**
	 * Go to the next tab
	 *
	 * @method nextTab
	 * @return void
	 */
	proto.nextTab = function() {
		var dst = this.getActiveTabIndex() + 1;
		if (_checkNextBounds.call(this, dst))
			this.setActiveTabIndex(dst);
	}

	/**
	 * setAttributeConfigs ScrollTabView specific properties.
	 *
	 * @method initAttributes
	 * @param {Object} attr Hash of initial attributes
	 */
	proto.initAttributes = function(attr) {

		YAHOO.yodeler.widget.ScrollTabView.superclass.initAttributes.call(this, attr);

		var self = this;
		
		this.setAttributeConfig('width', {
			value: attr.width || false,
			method: _computeStyle.call(this),
			validator: YAHOO.lang.isNumber
		});
		this.setAttributeConfig('height', {
			value: attr.height || false,
			method: _computeStyle.call(this),
			validator: YAHOO.lang.isNumber
		});
		this.setAttributeConfig('direction', {
			value: attr.direction || 'horizontal',
			method: _computeStyle.call(this),
			validator: function(direction) {
				if (YAHOO.lang.isString(direction)) {
					return 'horizontal,vertical'.indexOf(direction.toLowerCase()) != -1;
				}
				return false;
			}
		});
		this.setAttributeConfig('easing', {
			value: attr.easing || YAHOO.util.Easing.easeBothStrong,
			validator: YAHOO.lang.isFunction
		});
		this.setAttributeConfig('duration', {
			value: attr.duration || 1,
			validator: YAHOO.lang.isNumber
		});
		this.setAttributeConfig('wrap', {
			value: attr.wrap || false,
			validator: YAHOO.lang.isBoolean
		});
		this.setAttributeConfig('tabList', {
			value: attr.tabList || true,
			method: function(bool) {
				// fixme: when set to false, a _tabParent element must exist
				// (in markup) or else _computeStyle gives up
				if (bool) {
					if (!this._tabParent) {
						var el = document.createElement('ul');
						Dom.addClass(el, this.TAB_PARENT_CLASSNAME);
						this.get('element').addChild(el);
						this._tabParent = el;
					}
				} else if (this._tabParent) {
					this.get('element').removeChild(this._tabParent);
					this._tabParent = null;
				}
				return bool;
			},
			validator: YAHOO.lang.isBoolean
		});
		this.setAttributeConfig('prevElement', {
			value: attr.prevElement || null,
			method: function(el) {
				var prevEl = this.get('prevElement');
				if (prevEl) {
					Event.removeListener(prevEl, 'click', _previousTabEvent);
				}
				prevEl = Dom.get(prevEl);
				if (prevEl) {
					Event.addListener(prevEl, 'click', _previousTabEvent, self);
				}
				return prevEl;
			}
		});
		this.setAttributeConfig('nextElement', {
			value: attr.nextElement || null,
			method: function(el) {
				var nextEl = this.get('nextElement');
				if (nextEl) {
					Event.removeListener(nextEl, 'click', _nextTabEvent);
				}
				nextEl = Dom.get(nextEl);
				if (nextEl) {
					Event.addListener(nextEl, 'click', _nextTabEvent, self);
				}
				return nextEl;
			}
		});

		// fixme: these handlers don't work yet

		this.setAttributeConfig('prevElementStateHandler', {
			value: attr.prevElementStateHandler || null,
			method: function(newHandler) {
				var handler = this.get('prevElementStateHandler');
				if (handler) {
					this._prevElementStateHandlerEvent.unsubscribe(handler, self);
				}
				if (newHandler) {
					if (!this._prevElementStateHandlerEvent) {
						this._prevElementStateHandlerEvent = Event.CustomEvent('onPrevElementStateChange', self);
					}
					this._prevElementStateHandlerEvent.subscribe(newHandler, self);
				}
				return newHandler;
			}
		});
		this.setAttributeConfig('nextElementStateHandler', {
			value: attr.nextElementStateHandler || null,
			method: function(newHandler) {
				var handler = this.get('nextElementStateHandler');
				if (handler) {
					this._nextElementStateHandlerEvent.unsubscribe(handler, self);
				}
				if (newHandler) {
					if (!this._nextElementStateHandlerEvent) {
						this._nextElementStateHandlerEvent = Event.CustomEvent('onNextElementStateChange', self);
					}
					this._nextElementStateHandlerEvent.subscribe(newHandler, self);
				}
				return newHandler;
			}
		});

		this.addListener('activeTabChange', function(ev) {

			// Override TabView's refusal to contentTransition
			// when the tab is already set to contentVisible
			var activeTab = this.get('activeTab');
			if (ev.newValue && !(activeTab && ev.newValue != activeTab)) {
				this.contentTransition(ev.newValue, activeTab);
			}

			// Determine if prev/next Elements need to be enabled or disabled
			_computeButtonState.call(this);

		});

		// Setup element styles
		_computeStyle.call(this);
	}

	var _previousTabEvent = function(ev, self) {
		self.previousTab();
	}

	var _nextTabEvent = function(ev, self) {
		self.nextTab();
	}

	var _isVertical = function() {
		return this.get('direction') == 'vertical';
	}

	var _checkNextBounds = function(idx) {
		return idx < this.get('tabs').length;
	}

	var _checkPrevBounds = function(idx) {
		return idx >= 0;
	}


	// fixme: not working yet
	var _computeButtonState = function() {
		if (_checkPrevBounds(this.getActiveTabIndex() - 1)) { // prev button on
			if (!this._prevElementEnabled) {
				this._prevElementEnabled = true;
				if (YAHOO.lang.isObject(this._prevElementStateHandlerEvent))
					this._prevElementStateHandlerEvent.fire(true, this);
				var el = this.get('prevElement');
				if (YAHOO.lang.isObject(el))
					Event.addListener(el, _previousTabEvent, this);
			}
		} else { // prev button off
			if (this._prevElementEnabled) {
				this._prevElementEnabled = false;
				if (YAHOO.lang.isObject(this._prevElementStateHandlerEvent))
					this._prevElementStateHandlerEvent.fire(false, this);
				var el = this.get('prevElement');
				if (YAHOO.lang.isObject(el))
					Event.removeListener(el, _previousTabEvent);
			}
		}
		if (_checkNextBounds.call(this, this.getActiveTabIndex() + 1)) { // next button on
			if (!this._nextElementEnabled) {
				this._nextElementEnabled = true;
				if (YAHOO.lang.isObject(this._nextElementStateHandlerEvent))
					this._nextElementStateHandlerEvent.fire(true, this);
				var el = this.get('nextElement');
				if (YAHOO.lang.isObject(el))
					Event.addListener(el, _nextTabEvent, this);
			}
		} else { // next button off
			if (this._nextElementEnabled && !this.get('wrap')) {
				this._nextElementEnabled = false;
				if (YAHOO.lang.isObject(this._nextElementStateHandlerEvent))
					this._nextElementStateHandlerEvent.fire(false, this);
				var el = this.get('nextElement');
				if (YAHOO.lang.isObject(el))
					Event.removeListener(el, _nextTabEvent);
			}
		}
	}

	var _computeStyle = function() {

		var width = this.get('width');
		var height = this.get('height');
		var direction = this.get('direction');

		if (!width || !height || !direction) return false; // wait until all Attributes are set

		Dom.setStyle(this._contentParent, 'overflow', 'hidden');
		Dom.setStyle(this._contentParent, 'position', 'relative');
		Dom.setStyle(this._contentParent, 'width', width + 'px');
		Dom.setStyle(this._contentParent, 'height', height + 'px');

		var tabs = this.get('tabs');

		for (var i = 0, length = tabs.length; i < length; ++i) {

			var contentElement = tabs[i].get('contentEl');

			Dom.setStyle(contentElement, 'position', 'absolute');
		
			if (_isVertical.call(this)) {	
				Dom.setStyle(contentElement, 'left', '0');
				Dom.setStyle(contentElement, 'top', (height * i) + 'px');
				Dom.setStyle(contentElement, 'height', height + 'px');
			} else {
				Dom.setStyle(contentElement, 'top', '0');
				Dom.setStyle(contentElement, 'left', (width * i) + 'px');
				Dom.setStyle(contentElement, 'width', width + 'px');
			}

			// Keep content visible for effect during transitions
			contentElement.style.display = 'block';

		}

		Dom.setStyle(this._contentParent, 'visibility', 'visible');

	}

})();
