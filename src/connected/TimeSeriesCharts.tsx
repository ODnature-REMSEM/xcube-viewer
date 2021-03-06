import { connect } from 'react-redux';

import { AppState } from '../states/appState';
import TimeSeriesCharts from '../components/TimeSeriesCharts';
import { removeTimeSeriesGroup } from "../actions/dataActions";
import { selectPlace, selectTime, selectTimeRange } from "../actions/controlActions";
import {
    selectedDatasetTimeRangeSelector,
    selectedPlaceGroupPlacesSelector,
    timeSeriesPlaceInfosSelector
} from '../selectors/controlSelectors';


const mapStateToProps = (state: AppState) => {
    return {
        locale: state.controlState.locale,
        timeSeriesGroups: state.dataState.timeSeriesGroups,
        selectedTime: state.controlState.selectedTime,
        selectedTimeRange: state.controlState.selectedTimeRange,
        dataTimeRange: selectedDatasetTimeRangeSelector(state),
        showPointsOnly: state.controlState.showTimeSeriesPointsOnly,
        showErrorBars: state.controlState.showTimeSeriesErrorBars,
        placeInfos: timeSeriesPlaceInfosSelector(state),
        places: selectedPlaceGroupPlacesSelector(state),
    }
};

const mapDispatchToProps = {
    selectTime,
    selectTimeRange,
    removeTimeSeriesGroup,
    selectPlace,
};

export default connect(mapStateToProps, mapDispatchToProps)(TimeSeriesCharts);
