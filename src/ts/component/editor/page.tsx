import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Block, Icon } from 'ts/component';
import { I, Key, Util } from 'ts/lib';
import { observer, inject } from 'mobx-react';
import { throttle } from 'lodash';

interface Props {
	commonStore?: any;
	blockStore?: any;
	editorStore?: any;
	dataset?: any;
};

const Constant = require('json/constant.json');
const $ = require('jquery');
const THROTTLE = 20;

@inject('commonStore')
@inject('editorStore')
@inject('blockStore')
@observer
class EditorPage extends React.Component<Props, {}> {

	timeoutHover: number = 0;

	constructor (props: any) {
		super(props);
		
		this.onKeyDown = this.onKeyDown.bind(this);
		this.onKeyUp = this.onKeyUp.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
	};

	render () {
		const { blockStore } = this.props;
		const { blocks } = blockStore;
		const tree = blockStore.getTree('', blocks);
		
		let n = 0;
		return (
			<div className="editor">
				<div className="blocks">
					<Icon id="add" className="add" />
				
					{tree.map((item: I.Block, i: number) => { 
						n = Util.incrementBlockNumber(item, n);
						return <Block 
							key={item.header.id} {...item} number={n} index={i}
							{...this.props}
							onKeyDown={throttle((e: any) => { this.onKeyDown(e); }, THROTTLE)} 
							onKeyUp={throttle((e: any) => { this.onKeyUp(e); }, THROTTLE)} 
						/>
					})}
				</div>
			</div>
		);
	};
	
	componentDidMount () {
		const win = $(window);
		
		this.unbind();
		win.on('mousemove.editor', throttle((e: any) => { this.onMouseMove(e); }, THROTTLE));
	};
	
	componentWillUnmount () {
		this.unbind();
	};
	
	unbind () {
		$(window).unbind('mousemove.editor');
	};
	
	onMouseMove (e: any) {
		const win = $(window);
		const node = $(ReactDOM.findDOMNode(this));
		const container = $('.pageMainEdit');
		const blocks = node.find('.block');
		const rectContainer = (container.get(0) as Element).getBoundingClientRect() as DOMRect;
		const st = win.scrollTop();
		const add = node.find('#add');
		const { pageX, pageY } = e;
		const offset = 100;
		
		let hovered: any = null;
		
		// Find hovered block by mouse coords
		blocks.each((i: number, item: any) => {
			item = $(item);
			
			let rect = $(item).get(0).getBoundingClientRect() as DOMRect;
			let { x, y, width, height } = rect;
			y += st;

			if ((pageX >= x) && (pageX <= x + width) && (pageY >= y) && (pageY <= y + height)) {
				hovered = item;
			};
		});
		
		let rect = { x: 0, y: 0, width: 0, height: 0 };
		if (hovered) {
			rect = (hovered.get(0) as Element).getBoundingClientRect() as DOMRect; 
		};
		
		let { x, y, width, height } = rect;
		y += st;
		
		window.clearTimeout(this.timeoutHover);
		
		if (hovered && (pageX >= x) && (pageX <= x + Constant.size.blockMenu) && (pageY >= offset) && (pageY <= st + rectContainer.height - offset)) {
			let dir = pageY < (y + height / 2) ? 'top': 'bottom';
			
			add.css({ opacity: 1, left: rect.x - rectContainer.x + 2, top: pageY - 10 });
			blocks.addClass('showMenu').removeClass('isAdding top bottom');
			
			if (hovered && (pageX <= x + 20)) {
				hovered.addClass('isAdding ' + dir);
			};
		} else {
			this.timeoutHover = window.setTimeout(() => {
				add.css({ opacity: 0 });
				blocks.removeClass('showMenu isAdding top bottom');
			}, 10);
		};
	};
	
	onKeyDown (e: any) {
		const { blockStore, editorStore, commonStore, dataset } = this.props;
		const { focused, range } = editorStore;
		const { blocks } = blockStore;
		const { selection } = dataset;
		
		const block = blocks.find((item: I.Block) => { return item.header.id == focused; });
		if (!block) {
			return;
		};
		
		const index = blocks.findIndex((item: I.Block) => { return item.header.id == focused; });
		const { content } = block;
		const node = $(ReactDOM.findDOMNode(this));

		let l = String(content.text || '').length;
		let k = e.which;
		
		if (
			((range.from == 0) && (k == Key.up)) ||
			((range.to == l) && (k == Key.down))
		) {
			e.preventDefault();
			
			const dir = (k == Key.up) ? -1 : 1;
			const next = blockStore.getNextBlock(focused, dir);
			
			if (e.shiftKey) {
				if (selection.get().length < 1) {
					window.getSelection().empty();
					selection.set([ focused ]);
					commonStore.menuClose('blockAction');					
				};
			} else {
				if (next && (next.header.type == I.BlockType.Text)) {
					const l = String(next.content.text || '').length;
					const newRange = (dir > 0 ? { from: 0, to: 0 } : { from: l, to: l });
					
					editorStore.rangeSave(next.header.id, newRange);
				};
			};
		};
		
		if (k == Key.enter) {
			e.preventDefault();
			
			let b = { 
				header: { 
					id: String(blockStore.blocks.length + 1),
					parentId: '', 
					type: I.BlockType.Text, 
					name: '', 
					icon: '' 
				},
				fields: {},
				content: {
					text: '',
					style: I.TextStyle.p,
					marks: [] as I.Mark[],
					marker: 0,
					toggleable: false,
					checkable: false,
					checked: false,
				},
				childBlocks: [] as I.Block[]
			};
			
			blockStore.blockAdd(b);
		};
	};
	
	onKeyUp (e: any) {
	};
	
};

export default EditorPage;