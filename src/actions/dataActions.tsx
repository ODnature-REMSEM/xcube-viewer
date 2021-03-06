import { Dispatch } from 'redux';

import { AppState } from '../states/appState';
import * as api from '../api'
import {
    AddActivity,
    addActivity,
    RemoveActivity,
    removeActivity,
    SelectDataset,
    selectDataset,
} from './controlActions';
import {
    Dataset,
} from '../model/dataset';
import { TimeSeries } from '../model/timeSeries';
import { ColorBars } from '../model/colorBar';
import { I18N } from '../config';
import {
    selectedDatasetIdSelector, selectedDatasetTimeDimensionSelector,
    selectedDatasetVariableSelector, selectedPlaceIdSelector, selectedPlaceSelector,
    selectedServerSelector
} from '../selectors/controlSelectors';
import { Server, ServerInfo } from '../model/server';
import { MessageLogAction, postMessage } from './messageLogActions';
import { findPlaceInPlaceGroups, Place, PlaceGroup } from '../model/place';
import * as geojson from 'geojson';
import { placeGroupsSelector } from '../selectors/dataSelectors';


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_SERVER_INFO = 'UPDATE_SERVER_INFO';
export type UPDATE_SERVER_INFO = typeof UPDATE_SERVER_INFO;

export interface UpdateServerInfo {
    type: UPDATE_SERVER_INFO;
    serverInfo: ServerInfo;
}

export function updateServerInfo() {
    return (dispatch: Dispatch<UpdateServerInfo | AddActivity | RemoveActivity | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        dispatch(addActivity(UPDATE_SERVER_INFO, I18N.get('Connecting to server')));

        api.getServerInfo(apiServer.url)
           .then((serverInfo: ServerInfo) => {
               dispatch(_updateServerInfo(serverInfo));
           })
           .catch(error => {
               dispatch(postMessage('error', error));
           })
            // 'then' because Microsoft Edge does not understand method finally
           .then(() => {
               dispatch(removeActivity(UPDATE_SERVER_INFO));
           });
    };
}

export function _updateServerInfo(serverInfo: ServerInfo): UpdateServerInfo {
    return {type: UPDATE_SERVER_INFO, serverInfo};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_DATASETS = 'UPDATE_DATASETS';
export type UPDATE_DATASETS = typeof UPDATE_DATASETS;

export interface UpdateDatasets {
    type: UPDATE_DATASETS;
    datasets: Dataset[];
}

export function updateDatasets() {
    return (dispatch: Dispatch<UpdateDatasets | SelectDataset | AddActivity | RemoveActivity | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        dispatch(addActivity(UPDATE_DATASETS, I18N.get('Loading data')));

        api.getDatasets(apiServer.url, getState().userAuthState.accessToken)
           .then((datasets: Dataset[]) => {
               dispatch(_updateDatasets(datasets));
               if (datasets.length > 0) {
                   const selectedDatasetId = datasets[0].id;
                   dispatch(selectDataset(selectedDatasetId, datasets, true) as any);
               }
           })
           .catch(error => {
               dispatch(postMessage('error', error));
               dispatch(_updateDatasets([]));
           })
            // 'then' because Microsoft Edge does not understand method finally
           .then(() => {
               dispatch(removeActivity(UPDATE_DATASETS));
           });
    };
}

export function _updateDatasets(datasets: Dataset[]): UpdateDatasets {
    return {type: UPDATE_DATASETS, datasets};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_DATASET_PLACE_GROUP = 'UPDATE_DATASET_PLACE_GROUP';
export type UPDATE_DATASET_PLACE_GROUP = typeof UPDATE_DATASET_PLACE_GROUP;

export interface UpdateDatasetPlaceGroup {
    type: UPDATE_DATASET_PLACE_GROUP;
    datasetId: string;
    placeGroup: PlaceGroup;
}

export function updateDatasetPlaceGroup(datasetId: string,
                                        placeGroup: PlaceGroup): UpdateDatasetPlaceGroup {
    return {type: UPDATE_DATASET_PLACE_GROUP, datasetId, placeGroup};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ADD_USER_PLACE = 'ADD_USER_PLACE';
export type ADD_USER_PLACE = typeof ADD_USER_PLACE;

export interface AddUserPlace {
    type: ADD_USER_PLACE;
    id: string;
    label: string;
    color: string;
    geometry: geojson.Geometry;
}

export function addUserPlace(id: string, label: string, color: string, geometry: geojson.Geometry) {
    return (dispatch: Dispatch<AddUserPlace>, getState: () => AppState) => {
        dispatch(_addUserPlace(id, label, color, geometry));
        if (getState().controlState.autoShowTimeSeries) {
            dispatch(addTimeSeries() as any);
        }
    };
}

export function _addUserPlace(id: string, label: string, color: string, geometry: geojson.Geometry): AddUserPlace {
    return {type: ADD_USER_PLACE, id, label, color, geometry};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_USER_PLACE = 'REMOVE_USER_PLACE';
export type REMOVE_USER_PLACE = typeof REMOVE_USER_PLACE;

export interface RemoveUserPlace {
    type: REMOVE_USER_PLACE;
    id: string;
    places: Place[];
}

export function removeUserPlace(id: string, places: Place[]): RemoveUserPlace {
    return {type: REMOVE_USER_PLACE, id, places};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_ALL_USER_PLACES = 'REMOVE_ALL_USER_PLACES';
export type REMOVE_ALL_USER_PLACES = typeof REMOVE_ALL_USER_PLACES;

export interface RemoveAllUserPlaces {
    type: REMOVE_ALL_USER_PLACES;
}

export function removeAllUserPlaces(): RemoveAllUserPlaces {
    return {type: REMOVE_ALL_USER_PLACES};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function addTimeSeries() {
    return (dispatch: Dispatch<UpdateTimeSeries | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        const selectedDatasetId = selectedDatasetIdSelector(getState());
        const selectedDatasetTimeDim = selectedDatasetTimeDimensionSelector(getState());
        const selectedVariable = selectedDatasetVariableSelector(getState());
        const selectedPlaceId = selectedPlaceIdSelector(getState());
        const selectedPlace = selectedPlaceSelector(getState())!;
        const timeSeriesUpdateMode = getState().controlState.timeSeriesUpdateMode;
        const useMedian = getState().controlState.showTimeSeriesMedian;
        const inclStDev = getState().controlState.showTimeSeriesErrorBars;
        let timeChunkSize = getState().controlState.timeChunkSize;

        const placeGroups = placeGroupsSelector(getState());

        if (selectedDatasetId && selectedVariable && selectedPlaceId && selectedDatasetTimeDim) {
            const timeLabels = selectedDatasetTimeDim.labels;
            const numTimeLabels = timeLabels.length;

            timeChunkSize = timeChunkSize > 0 ? timeChunkSize : numTimeLabels;

            let endTimeIndex = numTimeLabels - 1;
            let startTimeIndex = endTimeIndex - timeChunkSize + 1;

            const getTimeSeriesChunk = () => {
                const startDateLabel = startTimeIndex >= 0 ? timeLabels[startTimeIndex] : null;
                const endDateLabel = timeLabels[endTimeIndex];
                return api.getTimeSeriesForGeometry(apiServer.url,
                                                    selectedDatasetId,
                                                    selectedVariable,
                                                    selectedPlace.id,
                                                    selectedPlace.geometry,
                                                    startDateLabel,
                                                    endDateLabel,
                                                    useMedian,
                                                    inclStDev,
                                                    getState().userAuthState.accessToken);
            };

            const successAction = (timeSeries: TimeSeries | null) => {
                if (timeSeries !== null && isValidPlace(placeGroups, selectedPlace.id)) {
                    const hasMore = startTimeIndex > 0;
                    const dataProgress = hasMore ? (numTimeLabels - startTimeIndex) / numTimeLabels : 1.0;
                    dispatch(updateTimeSeries({...timeSeries, dataProgress},
                                              timeSeriesUpdateMode,
                                              endTimeIndex === numTimeLabels - 1 ? 'new' : 'append'));
                    if (hasMore && isValidPlace(placeGroups, selectedPlace.id)) {
                        startTimeIndex -= timeChunkSize;
                        endTimeIndex -= timeChunkSize;
                        getTimeSeriesChunk().then(successAction);
                    }
                } else {
                    dispatch(postMessage('info', 'No data found here'));
                }
            };

            getTimeSeriesChunk()
                .then(successAction)
                .catch((error: any) => {
                    dispatch(postMessage('error', error));
                });
        }
    };
}

function isValidPlace(placeGroups: PlaceGroup[], placeId: string) {
    return findPlaceInPlaceGroups(placeGroups, placeId) !== null;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_TIME_SERIES = 'UPDATE_TIME_SERIES';
export type UPDATE_TIME_SERIES = typeof UPDATE_TIME_SERIES;

export interface UpdateTimeSeries {
    type: UPDATE_TIME_SERIES;
    timeSeries: TimeSeries;
    updateMode: 'add' | 'replace' | 'remove';
    dataMode: 'new' | 'append';
}

export function updateTimeSeries(timeSeries: TimeSeries, updateMode: 'add' | 'replace' | 'remove', dataMode: 'new' | 'append'): UpdateTimeSeries {
    return {type: UPDATE_TIME_SERIES, timeSeries, updateMode, dataMode};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_TIME_SERIES_GROUP = 'REMOVE_TIME_SERIES_GROUP';
export type REMOVE_TIME_SERIES_GROUP = typeof REMOVE_TIME_SERIES_GROUP;

export interface RemoveTimeSeriesGroup {
    type: REMOVE_TIME_SERIES_GROUP;
    id: string;
}

export function removeTimeSeriesGroup(id: string): RemoveTimeSeriesGroup {
    return {type: REMOVE_TIME_SERIES_GROUP, id};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_ALL_TIME_SERIES = 'REMOVE_ALL_TIME_SERIES';
export type REMOVE_ALL_TIME_SERIES = typeof REMOVE_ALL_TIME_SERIES;

export interface RemoveAllTimeSeries {
    type: REMOVE_ALL_TIME_SERIES;
}

export function removeAllTimeSeries(): RemoveAllTimeSeries {
    return {type: REMOVE_ALL_TIME_SERIES};
}

////////////////////////////////////////////////////////////////////////////////////////////////


export const CONFIGURE_SERVERS = 'CONFIGURE_SERVERS';
export type CONFIGURE_SERVERS = typeof CONFIGURE_SERVERS;

export interface ConfigureServers {
    type: CONFIGURE_SERVERS;
    servers: Server[];
    selectedServerId: string;
}

export function configureServers(servers: Server[], selectedServerId: string) {
    return (dispatch: Dispatch<any>, getState: () => AppState) => {
        if (getState().controlState.selectedServerId !== selectedServerId) {
            dispatch(removeAllTimeSeries());
            dispatch(_configureServers(servers, selectedServerId));
            dispatch(updateServerInfo());
            dispatch(updateDatasets());
            dispatch(updateColorBars());
        } else if (getState().dataState.userServers !== servers) {
            dispatch(_configureServers(servers, selectedServerId));
        }
    };
}

export function _configureServers(servers: Server[], selectedServerId: string): ConfigureServers {
    return {type: CONFIGURE_SERVERS, servers, selectedServerId};
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_COLOR_BARS = 'UPDATE_COLOR_BARS';
export type UPDATE_COLOR_BARS = typeof UPDATE_COLOR_BARS;

export interface UpdateColorBars {
    type: UPDATE_COLOR_BARS;
    colorBars: ColorBars;
}

export function updateColorBars() {
    return (dispatch: Dispatch<UpdateColorBars | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        api.getColorBars(apiServer.url)
           .then((colorBars: ColorBars) => {
               dispatch(_updateColorBars(colorBars));
           })
           .catch(error => {
               dispatch(postMessage('error', error));
           });
    };
}

export function _updateColorBars(colorBars: ColorBars): UpdateColorBars {
    return {type: UPDATE_COLOR_BARS, colorBars};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export const UPDATE_VARIABLE_COLOR_BAR = 'UPDATE_VARIABLE_COLOR_BAR';
export type UPDATE_VARIABLE_COLOR_BAR = typeof UPDATE_VARIABLE_COLOR_BAR;

export interface UpdateVariableColorBar {
    type: UPDATE_VARIABLE_COLOR_BAR;
    datasetId: string;
    variableName: string;
    colorBarMinMax: [number, number];
    colorBarName: string;
}

export function updateVariableColorBar(colorBarMinMax: [number, number], colorBarName: string) {
    return (dispatch: Dispatch<UpdateVariableColorBar>, getState: () => AppState) => {
        const selectedDatasetId = getState().controlState.selectedDatasetId;
        const selectedVariableName = getState().controlState.selectedVariableName;
        if (selectedDatasetId && selectedVariableName) {
            dispatch(_updateVariableColorBar(selectedDatasetId, selectedVariableName, colorBarMinMax, colorBarName));
        }
    };
}

export function _updateVariableColorBar(datasetId: string,
                                        variableName: string,
                                        colorBarMinMax: [number, number],
                                        colorBarName: string): UpdateVariableColorBar {
    return {type: UPDATE_VARIABLE_COLOR_BAR, datasetId, variableName, colorBarMinMax, colorBarName};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type DataAction =
    UpdateServerInfo
    | UpdateDatasets
    | UpdateDatasetPlaceGroup
    | AddUserPlace
    | RemoveUserPlace
    | RemoveAllUserPlaces
    | UpdateTimeSeries
    | RemoveTimeSeriesGroup
    | RemoveAllTimeSeries
    | ConfigureServers
    | UpdateColorBars
    | UpdateVariableColorBar;
