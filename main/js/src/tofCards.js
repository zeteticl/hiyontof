/**
 * どどんとふのカードを処理するクラス。
 * とりあえずは閲覧のみ。
 */

var com = com || {};
com.hiyoko = com.hiyoko || {};
com.hiyoko.tofclient = com.hiyoko.tofclient || {};
com.hiyoko.tofclient.Map = com.hiyoko.tofclient.Map || {};
com.hiyoko.tofclient.Map.Cards = function($html, cardsBaseInfo, tofUrl) {
	var id = $html.attr('id');
	
	var $disp = $('#' + id + '-display');
	
	var $mount = $('#' + id + '-display-mount');
	var $active = $('#' + id + '-display-active');
	var $trush = $('#' + id + '-display-trush');
	
	var cardConverter = new com.hiyoko.tofclient.Map.Cards.Converter(id, tofUrl);
	
	var cardType = {};
	$.each(cardsBaseInfo, function(i, v){
		cardType[v.type] = v.title;
	});
	
	this.update = function(res){
		var activeTypes = getCardTypes(res);
		
		displayCardMount(res.roomInfo.cardMount, activeTypes);
		displayCardActive(res.characters, activeTypes);
		displayCardTrush(res.roomInfo.cardTrushMount, activeTypes);
	}
	
	function printCard(card) {
		return cardConverter.cardToDom(card);
	}
	
	function displayCardActive(cards, at) {
		var $base = $('<div></div>');
		
		$base.append('<h2>手札</h2>');
		
		cards = extractCards(cards);
		var mountNamedCards = groupArray(cards, function(c){return c.mountName;});
		
		
		$.each(at, function(i, v){
			var $cardTypeBase = $('<h3 class="' + id + '-display-card-title"></h3>');
			$cardTypeBase.text(cardType[v] + '……手' + mountNamedCards[v].length + '枚');
			$base.append($cardTypeBase);
			
			var tCards = groupArray(mountNamedCards[v], function(v){
				return v.ownerName;
			});
			
			for(var key in tCards) {
				var $owner = $('<h4 class="' + id + '-display-card-owner"></h4>');
				$owner.text((key || '持ち主不明') + '……手' + tCards[key].length + '枚');
				$base.append($owner);
				$.each(tCards[key], function(i, v){
					$base.append(printCard(v));
				});
			}
		});
		
		$active.empty();
		$active.append($base);
	}
	
	function displayCardTrush(cards, at) {
		var $base = $('<div></div>');
		
		$base.append('<h2>捨札</h2>');
		
		$.each(at, function(i, v){
			var $cardTypeBase = $('<h3 class="' + id + '-display-card-title"></h3>');
			$cardTypeBase.text(cardType[v] + '……捨' + cards[v].length + '枚');
			$base.append($cardTypeBase);
			
			var tCards = groupArray(cards[v], function(v){
				return v.ownerName;
			});
			
			for(var key in tCards) {
				var $owner = $('<h4 class="' + id + '-display-card-owner"></h4>');
				$owner.text((key || '持ち主不明') + '……捨' + tCards[key].length + '枚');
				$base.append($owner);
				$.each(tCards[key], function(i, v){
					$base.append(printCard(v));
				});
			}
		});
		$trush.empty();
		$trush.append($base);
	}
	
	function displayCardMount(cards, at) {
		var $base = $('<div></div>');
		
		$base.append('<h2>山札</h2>');
		
		$.each(at, function(i, v){
			var $cardTypeBase = $('<h3 class="' + id + '-display-card-title"></h3>');
			$cardTypeBase.text(cardType[v] + '……残' + cards[v].length + '枚');
			$base.append($cardTypeBase);
		});
		$mount.empty();
		$mount.append($base);
	}
	
	function getCardTypes(res) {
		var result = [];
		for(var key in res.roomInfo.cardMount) {
			result.push(key);
		}
		return result.sort();
	}
	
	function extractCards(cardsCand, opt_filters) {
		if(opt_filters){
			var result = cardsCand;
			for(var key in opt_filters) {
				result = result.filter(function(c){
					return c[key] === opt_filters[key];
				});
				return result;
			}
		} else {
			return cardsCand.filter(function(c){
				return c.type === 'Card';
			});	
		}
	}
};

com.hiyoko.tofclient.Map.Cards.Converter = function(_id, _url){
	var self = this;
	var id = _id;
	var url = _url;
	
	this.ctd = function(card) {
		return self.cardToDom(card);
	}
	
	this.cardToDom = function(card) {
		return (this.selectParser(card))(card, id, _url);
	};
	
	this.selectParser = function(card) {
		var type = card.mountName;
		if(type === 'insane'){
			return com.hiyoko.tofclient.Map.Cards.InsaneParser;
		}
		
		if(type === 'trump_swf') {
			return com.hiyoko.tofclient.Map.Cards.TrumpParser;
		}
		
		return com.hiyoko.tofclient.Map.Cards.DefaultParser;
	};
};

com.hiyoko.tofclient.Map.Cards.InsaneParser =  function(card, id) {
	var $dom = $('<div class="' + id + '-display-card insane"></div>');
	if(card.isOpen) {
		var text = card.imageName.split('\t')[0]
			.replace(/\s*/g, '')
			.replace(/<BR>/g, '###BR###')
			.replace(/<i>Handout<\/i>/, 'Handout###BR###')
			.replace(/FONT SIZE="42">([^<]*)<\/FONT>/, '$&###BR###')
			.replace(/<[^>]*>/g, '');
		$dom.html(text.replace(/###BR###/g, '<br/>'));
	} else {
		$dom.text('非公開');
	}
	return $dom;
};

com.hiyoko.tofclient.Map.Cards.TrumpParser = function(card, id) {
	var $dom = $('<div class="' + id + '-display-card trump_swf"></div>');
	if(card.isOpen) {
		$dom.text(card.imageName.split('\t')[1]);
	} else {
		$dom.text('非公開');
	}
	return $dom;
};

com.hiyoko.tofclient.Map.Cards.DefaultParser = function(card, id, url){
	var $dom = $('<div class="' + id + '-display-card"></div>');
	var $img = $('<img />');
	var $title = $('<p></p>');
	if(card.isOpen) {
		$img.attr('src', com.hiyoko.tof.parseResourceUrl(card.imageName, url));
		$title.text(card.name || card.imageName.split('\t')[1] || card.imageName);
	} else {
		$img.attr('src', com.hiyoko.tof.parseResourceUrl(card.imageNameBack, url));
		$title.text('非公開');
	}
	
	$dom.append($img);
	$dom.append($title);
	return $dom;
};

