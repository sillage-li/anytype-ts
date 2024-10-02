import * as React from 'react';
import $ from 'jquery';
import { Loader, Icon, ObjectName } from 'Component';
import { I, S, J, U, keyboard, sidebar } from 'Lib';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Mousewheel } from 'swiper/modules';

const BORDER = 16;
const WIDTH_VIDEO = 1040;
const HEIGHT_VIDEO = 585;

const HEIGHT_HEADER = 52;
const HEIGHT_FOOTER = 96;

class PopupPreview extends React.Component<I.Popup> {

	swiper = null;
	thumbs = null;
	galleryMap: Map<number, any> = new Map();
	current: any = null;

	constructor (props: I.Popup) {
		super(props);

		this.onMore = this.onMore.bind(this);
		this.onSlideChange = this.onSlideChange.bind(this);
		this.onError = this.onError.bind(this);
		this.setCurrent = this.setCurrent.bind(this);
	};

	render () {
		const { param, close } = this.props;
		const { data } = param;
		const { gallery } = data;
		const initial = data.initialIdx || 0;

		const getContent = (item: any, idx: number, isThumb?: boolean) => {
			const { src, type, object } = item;
			const id = U.Common.toCamelCase([ 'item', (isThumb ? 'thumb' : 'preview'), idx ].join('-'));
			const loader = !isThumb ? <Loader className="loader" /> : '';

			const onClick = (e: any) => {
				if (isThumb) {
					e.preventDefault();
					e.stopPropagation();

					if (this.swiper.activeIndex != idx) {
						this.swiper.slideTo(idx);
						this.thumbs.slideTo(idx);
					};
				};
			};

			let content = null;

			switch (type) {
				case I.FileType.Image: {
					content = <img className="media" src={src} onDragStart={e => e.preventDefault()} />;
					break;
				};

				case I.FileType.Video: {
					content = <video src={src} controls={true} autoPlay={false} loop={true} />;
					break;
				};
			};

			return (
				<div onClick={onClick} id={id} className="previewItem">
					{loader}
					<div className="mediaContainer">
						{content}
					</div>
					<div className="itemDimmer" onClick={() => close()} />
				</div>
			);
		};

		return (
			<div id="wrap" className="wrap">
				<div className="galleryHeader">
					{this.current ? (
						<div className="head">
							<div className="side left">
							</div>
							<div className="side center">
								<ObjectName object={this.current} />
							</div>
							<div className="side right">
								<Icon id="button-header-more" tooltip="Menu" className="more withBackground" onClick={this.onMore} />
							</div>
						</div>
					) : ''}
				</div>

				<div className="gallerySlides">
					<Swiper
						initialSlide={initial}
						spaceBetween={8}
						slidesPerView={1}
						centeredSlides={true}
						keyboard={{ enabled: true }}
						mousewheel={true}
						modules={[ Mousewheel, Keyboard ]}
						onSwiper={swiper => this.swiper = swiper}
						onTransitionEnd={(data) => this.onSlideChange(data)}
					>
						{gallery.map((item: any, i: number) => (
							<SwiperSlide key={i}>
								{getContent(item, i)}
							</SwiperSlide>
						))}
					</Swiper>
				</div>

				<div className="galleryFooter">
					{gallery.length > 1 ? (
						<div className="thumbnails">
							<Swiper
								height={HEIGHT_FOOTER}
								initialSlide={initial}
								spaceBetween={8}
								slidesPerView={10}
								onSwiper={swiper => this.thumbs = swiper}
							>
								{gallery.map((item: any, i: number) => (
									<SwiperSlide key={i}>
										{getContent(item, i, true)}
									</SwiperSlide>
								))}
							</Swiper>
						</div>
					) : ''}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		this.onLoad();
		this.rebind();
		this.setCurrent();
	};

	componentWillUnmount () {
		this.unbind();
	};

	unbind () {
		$(window).off('resize.popupPreview keydown.popupPreview');
	};

	rebind () {
		this.unbind();

		const win = $(window);
		win.on('resize.popupPreview', () => this.onLoad());
		win.on('keydown.menu', e => this.onKeyDown(e));
	};

	setCurrent (idx?: number) {
		const { param} = this.props;
		const { data } = param;
		const { gallery } = data;
		const initialIdx = data.initialIdx || 0;

		if (!idx) {
			idx = initialIdx;
		};

		const item = gallery[idx];

		if (item.object) {
			this.current = item.object;
			this.forceUpdate();
		};
	};

	onKeyDown (e: any) {
		keyboard.shortcut('escape', e, () => this.props.close());
	};
	
	onMore () {
		const { param, getId } = this.props;
		const { data } = param;
		const { object } = data;

		S.Menu.open('object', {
			element: `#${getId()} #button-header-more`,
			horizontal: I.MenuDirection.Right,
			subIds: J.Menu.object,
			data: {
				rootId: object.id,
				blockId: object.id,
				blockIds: [ object.id ],
				object,
				isFilePreview: true,
			}
		});
	};

	onSlideChange (data) {
		if (!this.thumbs && !this.swiper) {
			return;
		};

		if (this.thumbs.activeIndex != data.activeIndex) {
			this.thumbs.slideTo(data.activeIndex);
		};

		this.setCurrent(data.activeIndex);
	};

	onLoad () {
		const { param} = this.props;
		const { data } = param;
		const { gallery } = data;

		gallery.forEach((el, idx) => {
			const { src, type } = el;

			if (!this.galleryMap.get(idx)) {
				this.galleryMap.set(idx, { src, type, isLoaded: false });
			};
			this.resize(idx);
		});
	};

	onError (idx) {
		const { getId } = this.props;
		const node = $(`#${getId()}-innerWrap`);
		const wrap = node.find(`#itemPreview-${idx}`);
		const obj = this.galleryMap.get(idx);

		wrap
			.addClass('brokenMedia')
			.find('.loader').remove();

		obj.isLoaded = true;
		this.galleryMap.set(idx, obj);
	};

	resize (idx: number) {
		const { getId } = this.props;
		const node = $(`#${getId()}-innerWrap`);
		const element = node.find(`#itemPreview-${idx}`);
		const loader = element.find('.loader')
		const obj = this.galleryMap.get(idx);
		const { src, type, isLoaded, width, height } = obj;

		switch (type) {
			case I.FileType.Image: {
				if (isLoaded) {
					if (width && height) {
						this.resizeMedia(idx, width, height);
					};
					break;
				};

				const img = new Image();
				img.onload = () => {
					obj.width = img.width;
					obj.height = img.height;
					obj.isLoaded = true;

					loader.remove();

					this.resizeMedia(idx, obj.width, obj.height);
					this.galleryMap.set(idx, obj);
				};

				img.onerror = this.onError;
				img.src = src;
				break;
			};

			case I.FileType.Video: {
				if (isLoaded) {
					if (width && height) {
						this.resizeMedia(idx, width, height);
					};
					break;
				};

				const video = element.find('video');
				const videoEl = video.get(0);

				let w = WIDTH_VIDEO;
				let h = HEIGHT_VIDEO;

				videoEl.onloadedmetadata = () => {
					w = videoEl.videoWidth;
					h = videoEl.videoHeight;

					obj.isLoaded = true;
					obj.width = w;
					obj.height = h;
					loader.remove();

					this.galleryMap.set(idx, obj);
					this.resizeMedia(idx, w, h);
					video.css({ width: '100%', height: '100%' });
				};
				videoEl.onerror = this.onError;

				video.css({ width: w, height: h });
			};
		};
	};

	resizeMedia (idx: number, width: number, height: number) {
		const { maxWidth, maxHeight } = this.getMaxWidthHeight();
		const { getId } = this.props;
		const obj = $(`#${getId()}-innerWrap`);
		const wrap = obj.find(`#itemPreview-${idx} .mediaContainer`);

		let w = 0, h = 0;
		if (width > height) {
			w = Math.min(maxWidth, width);
			h = w / (width / height);
		} else {
			h = Math.min(maxHeight, height);
			w = h / (height / width);
		};

		wrap.css({ width: w, height: h });
	};

	getMaxWidthHeight () {
		const { ww, wh } = U.Common.getWindowDimensions();
		const maxHeight = wh - (HEIGHT_FOOTER + HEIGHT_HEADER);
		const maxWidth = ww - BORDER * 2 - sidebar.getDummyWidth();

		return { maxWidth, maxHeight };
	};

};

export default PopupPreview;
