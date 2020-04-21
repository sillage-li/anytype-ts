import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { RouteComponentProps } from 'react-router';
import { Block } from 'ts/component';
import { I, M, Util } from 'ts/lib';
import { blockStore } from 'ts/store';
import { observer } from 'mobx-react';

const $ = require('jquery');
const raf = require('raf');

interface Props extends RouteComponentProps<any> {
	rootId: string;
};

interface State {
	type: string;
	width: number;
	ids: string[];
};

@observer
class DragLayer extends React.Component<Props, State> {
	
	_isMounted: boolean = false;
	state = {
		type: '',
		width: 0,
		ids: [] as string[]
	};
	
	constructor (props: any) {
		super(props);
		
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.move = this.move.bind(this);
	};
	
	render () {
		const { ids, type, width } = this.state;
		
		if (!type) {
			return null;
		};
		
		const { rootId } = this.props;
		
		let content = null;
		
		switch (type) {
			case I.DragItem.Block:
				const blocks = ids.map((id: string) => {
					let block = Util.objectCopy(blockStore.getLeaf(rootId, id));
					
					block.id = '';
					return new M.Block(block);
				});
			
				content = (
					<div className="blocks">
						{blocks.map((block: any, i: number) => {
							return <Block key={i} {...this.props} block={block} rootId={rootId} index={i} />
						})}
					</div>
				);
				break;
		};
		
		return (
			<div className="dragLayer" style={{ width: width }}>
				{content}
			</div>
		);
	};
	
	componentDidMount () {
		this._isMounted = true;
	};
	
	componentWillUnmount () {
		this._isMounted = false;
	};
	
	show (type: string, ids: string[], component: any) {
		if (!this._isMounted) {
			return;
		};
		
		const comp = $(ReactDOM.findDOMNode(component));
		const rect = comp.get(0).getBoundingClientRect() as DOMRect;
		
		this.setState({ type: type, width: rect.width, ids: ids });
	};
	
	hide () {
		if (!this._isMounted) {
			return;
		};
		
		const node = $(ReactDOM.findDOMNode(this));
		
		node.css({ left: '', top: '' });
		this.setState({ type: '', ids: [] });
	};
	
	move (x: number, y: number) {
		raf(() => {
			if (!this._isMounted) {
				return;
			};
			
			const node = $(ReactDOM.findDOMNode(this));
			const css = x && y ? { left: 0, top: 0, transform: `translate3d(${x + 10}px, ${y + 10}px, 0px)` } : { left: '', top: '' };
			
			node.css(css);
		});
	};
	
};

export default DragLayer;