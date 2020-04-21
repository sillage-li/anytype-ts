import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { I } from 'ts/lib';
import { RouteComponentProps } from 'react-router';
import { blockStore } from 'ts/store';
import { HeaderMainEdit as Header, DragProvider, SelectionProvider, EditorPage } from 'ts/component';

interface Props extends I.Popup, RouteComponentProps<any> {};

const Constant = require('json/constant.json'); 

class PopupEditorPage extends React.Component<Props, {}> {
	
	render () {
		const { history, location, match, param } = this.props;
		const { data } = param;
		const { id } = data;
		
		return (
			<SelectionProvider rootId={id} container=".popupEditorPage .content">
				<DragProvider {...this.props} rootId={id}>
					<Header {...this.props} rootId={id} />
							
					<EditorPage history={history} location={location} match={match} rootId={id} />
				</DragProvider>
			</SelectionProvider>
		);
	};
	
};

export default PopupEditorPage;