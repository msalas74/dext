import { ipcRenderer } from 'electron';
import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import * as actionCreators from '../actions/creators';
import ResultList from '../components/ResultList';
import { ResultItemSchema, ThemeSchema } from '../schema';
import {
  IPC_WINDOW_RESIZE,
  IPC_QUERY_RESULTS,
  IPC_SELECT_PREVIOUS_ITEM,
  IPC_SELECT_NEXT_ITEM,
  IPC_COPY_CURRENT_ITEM_KEY,
  IPC_COPY_CURRENT_ITEM,
  IPC_EXECUTE_CURRENT_ITEM,
  IPC_ITEM_DETAILS_REQUEST,
  IPC_EXECUTE_ITEM,
} from '../../../ipc';

const ResultListContainer = class extends Component {
  componentDidMount() {
    const self = this;
    const { updateResults, resetResults, selectNextItem, selectPreviousItem } = this.props;
    // focus the query input field when the window is shown
    ipcRenderer.on(IPC_QUERY_RESULTS, (evt, newResults) => {
      // update the height
      if (newResults.length) {
        // TODO: compute the height + added padding
        const height = (newResults.length * 60) + 30;
        ipcRenderer.send(IPC_WINDOW_RESIZE, { height });
      }
      if (newResults.length) {
        updateResults(newResults);
      } else {
        resetResults();
      }
    });
    ipcRenderer.on(IPC_SELECT_PREVIOUS_ITEM, () => {
      if (self.props.selectedIndex > 0) {
        selectPreviousItem();
        self.scrollToItem(self.props.selectedIndex);
        self.retrieveDetails(self.props.selectedIndex);
      }
    });
    ipcRenderer.on(IPC_SELECT_NEXT_ITEM, () => {
      if (self.props.selectedIndex < self.props.results.length - 1) {
        selectNextItem();
        self.scrollToItem(self.props.selectedIndex);
        self.retrieveDetails(self.props.selectedIndex);
      }
    });
    ipcRenderer.on(IPC_COPY_CURRENT_ITEM_KEY, () => {
      self.copyItem();
    });
    ipcRenderer.on(IPC_EXECUTE_CURRENT_ITEM, () => {
      self.execute();
    });
  }

  /**
   * Retrieves the extended details for the given item
   *
   * @param {Number} index - The index of the results
   */
  retrieveDetails(index) {
    const item = this.props.results[index];
    ipcRenderer.send(IPC_ITEM_DETAILS_REQUEST, item);
  }

  /**
   * Copies the selected item to the clipboard
   */
  copyItem() {
    const { results, selectedIndex } = this.props;
    const item = results[selectedIndex];
    ipcRenderer.send(IPC_COPY_CURRENT_ITEM, item);
  }

  /**
   * Executs the current item
   */
  execute() {
    const { results, selectedIndex } = this.props;
    const item = results[selectedIndex];
    const { action } = item;
    ipcRenderer.send(IPC_EXECUTE_ITEM, { action, item });
  }

  /**
   * Scrolls the list to the given item
   *
   * @param {Number} index
   */
  scrollToItem(index) {
    const scrollY = (index >= 10)
      ? ((index - 10) * 60) + 60
      : 0;

    this.c.c.scrollTop = scrollY;
  }

  render() {
    const { theme, results, selectedIndex } = this.props;
    if (results.length) {
      return (
        <ResultList
          ref={c => { this.c = c; }}
          theme={theme}
          results={results}
          selectedIndex={selectedIndex}
        />
      );
    }
    return null;
  }
};

ResultListContainer.defaultProps = {
  theme: {},
  results: [],
  selectedIndex: 0,
  selectItem: () => { },
  selectNextItem: () => { },
  selectPreviousItem: () => { },
  updateResults: () => { },
  resetResults: () => { },
};

ResultListContainer.propTypes = {
  theme: ThemeSchema,
  results: PropTypes.arrayOf(ResultItemSchema),
  selectedIndex: PropTypes.number,
  selectNextItem: PropTypes.func,
  selectPreviousItem: PropTypes.func,
  updateResults: PropTypes.func,
  resetResults: PropTypes.func,
};

const mapStateToProps = state => ({
  results: state.results,
  selectedIndex: state.selectedIndex,
});

const mapDispatchToProps = dispatch => bindActionCreators(actionCreators, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(ResultListContainer);
