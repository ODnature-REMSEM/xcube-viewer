import { Dispatch } from 'redux';

import {
    selectedDatasetSelectedPlaceGroupsSelector,
    selectedDatasetSelector,
    selectedServerSelector,
} from '../selectors/controlSelectors';
import { Dataset } from '../model/dataset';
import { Time, TimeRange } from '../model/timeSeries';
import { AppState } from '../states/appState';
import * as api from '../api'
import { MessageLogAction, postMessage } from './messageLogActions';
import {
    updateDatasetPlaceGroup, UPDATE_DATASET_PLACE_GROUP,
    UpdateDatasetPlaceGroup,
} from './dataActions';
import { isValidPlaceGroup, PlaceGroup } from '../model/place';
import { I18N } from '../config';

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_DATASET = 'SELECT_DATASET';
export type SELECT_DATASET = typeof SELECT_DATASET;

export interface SelectDataset {
    type: SELECT_DATASET;
    selectedDatasetId: string | null;
    // TODO: Having datasets in here is ugly, but we need it in the reducer.
    // See
    // - https://medium.com/@williamjoshualacey/refactoring-redux-using-react-context-aa29fa16f4b7
    // - https://codeburst.io/the-ugly-side-of-redux-6591fde68200
    datasets: Dataset[];
}

export function selectDataset(selectedDatasetId: string | null, datasets: Dataset[]): SelectDataset {
    return {type: SELECT_DATASET, selectedDatasetId, datasets};
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_PLACE_GROUPS = 'SELECT_PLACE_GROUPS';
export type SELECT_PLACE_GROUPS = typeof SELECT_PLACE_GROUPS;

export interface SelectPlaceGroups {
    type: SELECT_PLACE_GROUPS;
    selectedPlaceGroupIds: string[] | null;
}

export function selectPlaceGroups(selectedPlaceGroupIds: string[] | null) {

    return (dispatch: Dispatch<SelectPlaceGroups | UpdateDatasetPlaceGroup | AddActivity | RemoveActivity | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        dispatch(_selectPlaceGroups(selectedPlaceGroupIds));

        const dataset = selectedDatasetSelector(getState());
        const placeGroups = selectedDatasetSelectedPlaceGroupsSelector(getState());
        if (dataset !== null && placeGroups.length > 0) {
            for (let placeGroup of placeGroups) {
                if (!isValidPlaceGroup(placeGroup)) {
                    const datasetId = dataset!.id;
                    const placeGroupId = placeGroup.id;
                    const activitityId = `${UPDATE_DATASET_PLACE_GROUP}-${datasetId}-${placeGroupId}`;
                    dispatch(addActivity(activitityId, I18N.get('Loading place group')));
                    api.getDatasetPlaceGroup(apiServer.url, datasetId, placeGroupId)
                       .then((placeGroup: PlaceGroup) => {
                           dispatch(updateDatasetPlaceGroup(dataset!.id, placeGroup));
                       })
                       .catch(error => {
                           dispatch(postMessage('error', error + ''));
                       })
                       .finally(() => {
                           dispatch(removeActivity(activitityId));
                       });
                }
            }
        }
    };
}

export function _selectPlaceGroups(selectedPlaceGroupIds: string[] | null): SelectPlaceGroups {
    return {type: SELECT_PLACE_GROUPS, selectedPlaceGroupIds};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_PLACE = 'SELECT_PLACE';
export type SELECT_PLACE = typeof SELECT_PLACE;

export interface SelectPlace {
    type: SELECT_PLACE;
    selectedPlaceId: string | null;
    // TODO: Having datasets in here is ugly, but we need it in the reducer.
    datasets: Dataset[];
    // TODO: Having userPlaceGroup in here is ugly, but we need it in the reducer.
    userPlaceGroup: PlaceGroup;
}

export function selectPlace(selectedPlaceId: string | null, datasets: Dataset[], userPlaceGroup: PlaceGroup): SelectPlace {
    return {type: SELECT_PLACE, selectedPlaceId, datasets, userPlaceGroup};
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_VARIABLE = 'SELECT_VARIABLE';
export type SELECT_VARIABLE = typeof SELECT_VARIABLE;

export interface SelectVariable {
    type: SELECT_VARIABLE;
    selectedVariableName: string | null;
}

export function selectVariable(selectedVariableName: string | null): SelectVariable {
    return {type: SELECT_VARIABLE, selectedVariableName};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_TIME = 'SELECT_TIME';
export type SELECT_TIME = typeof SELECT_TIME;

export interface SelectTime {
    type: SELECT_TIME;
    selectedTime: Time | null;
}

export function selectTime(selectedTime: Time | null): SelectTime {
    return {type: SELECT_TIME, selectedTime};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const INC_SELECTED_TIME = 'INC_SELECTED_TIME';
export type INC_SELECTED_TIME = typeof INC_SELECTED_TIME;

export interface IncSelectedTime {
    type: INC_SELECTED_TIME;
    increment: -1 | 1;
}

export function incSelectedTime(increment: -1 | 1): IncSelectedTime {
    return {type: INC_SELECTED_TIME, increment};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_TIME_RANGE = 'SELECT_TIME_RANGE';
export type SELECT_TIME_RANGE = typeof SELECT_TIME_RANGE;

export interface SelectTimeRange {
    type: SELECT_TIME_RANGE;
    selectedTimeRange: TimeRange | null;
}

export function selectTimeRange(selectedTimeRange: TimeRange | null): SelectTimeRange {
    return {type: SELECT_TIME_RANGE, selectedTimeRange};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const SELECT_TIME_SERIES_UPDATE_MODE = 'SELECT_TIME_SERIES_UPDATE_MODE';
export type SELECT_TIME_SERIES_UPDATE_MODE = typeof SELECT_TIME_SERIES_UPDATE_MODE;

export interface SelectTimeSeriesUpdateMode {
    type: SELECT_TIME_SERIES_UPDATE_MODE;
    timeSeriesUpdateMode: 'add' | 'replace';
}

export function selectTimeSeriesUpdateMode(timeSeriesUpdateMode: 'add' | 'replace'): SelectTimeSeriesUpdateMode {
    return {type: SELECT_TIME_SERIES_UPDATE_MODE, timeSeriesUpdateMode};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_TIME_ANIMATION = 'UPDATE_TIME_ANIMATION';
export type UPDATE_TIME_ANIMATION = typeof UPDATE_TIME_ANIMATION;

export interface UpdateTimeAnimation {
    type: UPDATE_TIME_ANIMATION;
    timeAnimationActive: boolean;
    timeAnimationInterval: number;
}

export function updateTimeAnimation(timeAnimationActive: boolean, timeAnimationInterval: number): UpdateTimeAnimation {
    return {type: UPDATE_TIME_ANIMATION, timeAnimationActive, timeAnimationInterval};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ADD_ACTIVITY = 'ADD_ACTIVITY';
export type ADD_ACTIVITY = typeof ADD_ACTIVITY;

export interface AddActivity {
    type: ADD_ACTIVITY;
    id: string;
    message: string;
}

export function addActivity(id: string, message: string): AddActivity {
    return {type: ADD_ACTIVITY, id, message};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_ACTIVITY = 'REMOVE_ACTIVITY';
export type REMOVE_ACTIVITY = typeof REMOVE_ACTIVITY;

export interface RemoveActivity {
    type: REMOVE_ACTIVITY;
    id: string;
}

export function removeActivity(id: string): RemoveActivity {
    return {type: REMOVE_ACTIVITY, id};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CHANGE_LOCALE = 'CHANGE_LOCALE';
export type CHANGE_LOCALE = typeof CHANGE_LOCALE;

export interface ChangeLocale {
    type: CHANGE_LOCALE;
    locale: string;
}

export function changeLocale(locale: string): ChangeLocale {
    return {type: CHANGE_LOCALE, locale};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const OPEN_DIALOG = 'OPEN_DIALOG';
export type OPEN_DIALOG = typeof OPEN_DIALOG;

export interface OpenDialog {
    type: OPEN_DIALOG;
    dialogId: string;
}

export function openDialog(dialogId: string): OpenDialog {
    return {type: OPEN_DIALOG, dialogId};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const CLOSE_DIALOG = 'CLOSE_DIALOG';
export type CLOSE_DIALOG = typeof CLOSE_DIALOG;

export interface CloseDialog {
    type: CLOSE_DIALOG;
    dialogId: string;
}

export function closeDialog(dialogId: string): CloseDialog {
    return {type: CLOSE_DIALOG, dialogId};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type ControlAction =
    SelectDataset
    | UpdateDatasetPlaceGroup
    | SelectVariable
    | SelectPlaceGroups
    | SelectPlace
    | SelectTime
    | IncSelectedTime
    | SelectTimeRange
    | SelectTimeSeriesUpdateMode
    | UpdateTimeAnimation
    | AddActivity
    | RemoveActivity
    | ChangeLocale
    | OpenDialog
    | CloseDialog;
