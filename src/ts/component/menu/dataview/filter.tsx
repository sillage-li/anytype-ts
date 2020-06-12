import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { Icon, Select, Input, Checkbox } from 'ts/component';
import { I, C } from 'ts/lib';
import arrayMove from 'array-move';
import { translate } from '../../../lib';

interface Props extends I.Menu {};

const $ = require('jquery');

class MenuFilter extends React.Component<Props, {}> {
	
	refObj: any = {};
	items: I.Filter[] = [] as I.Filter[];
	
	constructor (props: any) {
		super(props);
		
		this.onAdd = this.onAdd.bind(this);
		this.onDelete = this.onDelete.bind(this);
		this.onSortEnd = this.onSortEnd.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	};
	
	render () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		
		const operatorOptions: I.Option[] = [
			{ id: String(I.FilterOperator.And), name: 'And' },
			{ id: String(I.FilterOperator.Or), name: 'Or' },
		];
		
		const relationOptions: I.Option[] = view.relations.map((it: I.ViewRelation) => {
			return { id: it.id, name: it.name, icon: 'relation c-' + it.type };
		});

		const Handle = SortableHandle(() => (
			<Icon className="dnd" />
		));
		
		const Item = SortableElement((item: any) => {
			const relation = view.relations.find((it: I.ViewRelation) => { return it.id == item.relationId; });
			if (!relation) {
				return null;
			};

			const conditionOptions = this.conditionsByType(relation.type);
			const refGet = (ref: any) => { this.refObj[item.id] = ref; }; 

			let value = null;
			switch (relation.type) {
				case I.RelationType.Checkbox:
					value = (
						<Checkbox 
						ref={refGet} 
						value={item.value} 
						onChange={(e: any, v: boolean) => { this.onChange(item.id, 'value', v); }} 
						/>
					);
					break;
				default:
					value = (
						<Input 
							ref={refGet} 
							value={item.value} 
							placeHolder="Value" 
							onKeyUp={(e: any, v: string) => { this.onChange(item.id, 'value', v); }} 
						/>
					);
					break;
			};

			return (
				<form className="item" onSubmit={(e: any) => { this.onSubmit(e, item); }}>
					<Handle />
					{item.id > 0 ? <Select id={[ 'filter', 'operator', item.id ].join('-')} options={operatorOptions} value={item.operator} onChange={(v: string) => { this.onChange(item.id, 'operator', v); }} /> : ''}
					<Select id={[ 'filter', 'relation', item.id ].join('-')} className="relation" options={relationOptions} value={item.relationId} onChange={(v: string) => { this.onChange(item.id, 'relationId', v); }} />
					<Select id={[ 'filter', 'condition', item.id ].join('-')} options={conditionOptions} value={item.condition} onChange={(v: string) => { this.onChange(item.id, 'condition', v); }} />
					{value}
					<Icon className="delete" onClick={(e: any) => { this.onDelete(e, item.id); }} />
				</form>
			);
		});
		
		const ItemAdd = SortableElement((item: any) => (
			<div className="item add" onClick={this.onAdd}>
				<Icon className="dnd" />
				<Icon className="plus" />
				<div className="name">Add a filter</div>
			</div>
		));
		
		const List = SortableContainer((item: any) => {
			return (
				<div className="items">
					{this.items.map((item: any, i: number) => (
						<Item key={i} {...item} id={i} index={i} />
					))}
					<ItemAdd index={this.items.length + 1} disabled={true} />
				</div>
			);
		});
		
		return (
			<List 
				axis="y" 
				lockAxis="y"
				lockToContainerEdges={true}
				transitionDuration={150}
				distance={10}
				onSortEnd={this.onSortEnd}
				useDragHandle={true}
				helperClass="dragging"
				helperContainer={() => { return $(ReactDOM.findDOMNode(this)).get(0); }}
			/>
		);
	};
	
	componentDidMount () {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;
		
		this.items = view.filters;
		this.forceUpdate();
	};

	componentDidUpdate () {
		this.props.position();
	};

	componentWillUnmount () {
		this.save();
	};

	conditionsByType (type: I.RelationType): I.Option[] {
		let ret = [];

		switch (type) {
			case I.RelationType.Title: 
			case I.RelationType.Description: 
			case I.RelationType.Url: 
			case I.RelationType.Email: 
			case I.RelationType.Phone: 
				ret = [ 
					I.FilterCondition.Equal, 
					I.FilterCondition.NotEqual, 
					I.FilterCondition.Like, 
					I.FilterCondition.NotLike,
				];
				break;
			
			case I.RelationType.Number:
			case I.RelationType.Date:
				ret = [ 
					I.FilterCondition.Equal, 
					I.FilterCondition.NotEqual, 
					I.FilterCondition.Greater, 
					I.FilterCondition.Less, 
					I.FilterCondition.GreaterOrEqual, 
					I.FilterCondition.LessOrEqual,
				];
				break;
			
			case I.RelationType.Checkbox:
				ret = [ 
					I.FilterCondition.Equal, 
					I.FilterCondition.NotEqual,
				];
				break;
		};

		ret = ret.map((it: I.FilterCondition) => {
			return { id: it, name: translate('filterCondition' + it) };
		});
		return ret;
	};
	
	onAdd (e: any) {
		const { param } = this.props;
		const { data } = param;
		const { view } = data;

		if (!view.relations.length) {
			return;
		};

		this.items.push({ 
			relationId: view.relations[0].id, 
			operator: I.FilterOperator.And, 
			condition: I.FilterCondition.Equal,
			value: '',
		});
		this.forceUpdate();
		this.save();
	};

	onChange (id: number, k: string, v: any) {
		let item = this.items.find((item: any, i: number) => { return i == id; });
		item[k] = v;

		// Remove value when we change relation
		if (k == 'relationId') {
			item.value = '';
		};

		this.save();
	};
	
	onDelete (e: any, id: number) {
		this.items = this.items.filter((item: any, i: number) => { return i != id; });
		this.forceUpdate();
		this.save();
	};
	
	onSortEnd (result: any) {
		const { oldIndex, newIndex } = result;
		
		this.items = arrayMove(this.items, oldIndex, newIndex);
		this.forceUpdate();
		this.save();
	};

	onSubmit (e: any, item: any) {
		e.preventDefault();

		this.items[item.id].value = this.refObj[item.id].getValue();
	};

	save () {
		const { param } = this.props;
		const { data } = param;
		const { view, rootId, blockId, onSave } = data;

		C.BlockSetDataviewView(rootId, blockId, view.id, { ...view, filters: this.items }, onSave);
	};

};

export default MenuFilter;