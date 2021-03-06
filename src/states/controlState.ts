import { default as OlBaseObject } from 'ol/Object';
import { Geometry as OlGeometry } from 'ol/geom';
import { Extent as OlExtent } from 'ol/extent';

import { Time, TimeRange } from '../model/timeSeries';
import { loadUserSettings } from './userSettings';
import { getBranding, getDefaultApiServer } from '../config';


export type TimeAnimationInterval = 250 | 500 | 1000 | 2500;
export const TIME_ANIMATION_INTERVALS: TimeAnimationInterval[] = [250, 500, 1000, 2500];

export type MapInteraction = 'Select' | 'Point' | 'Polygon' | 'Circle';


export interface InfoCardElementState {
    visible?: boolean;
    viewMode?: string;
}

export interface InfoCardElementStates {
    [key: string]: InfoCardElementState;
}

export interface ControlState {
    selectedDatasetId: string | null;
    selectedVariableName: string | null;
    selectedPlaceGroupIds: string[] | null;
    selectedPlaceId: string | null;
    selectedUserPlaceId: string | null;
    selectedServerId: string;
    selectedTime: Time | null;
    selectedTimeRange: TimeRange | null;
    timeSeriesUpdateMode: 'add' | 'replace';
    timeAnimationActive: boolean;
    timeAnimationInterval: TimeAnimationInterval;
    timeChunkSize: number;
    autoShowTimeSeries: boolean;
    showTimeSeriesPointsOnly: boolean;
    showTimeSeriesErrorBars: boolean;
    showTimeSeriesMedian: boolean;
    flyTo: OlGeometry | OlExtent | null;
    activities: { [id: string]: string };
    locale: string;
    dialogOpen: { [dialogId: string]: boolean };
    legalAgreementAccepted: boolean;
    mapInteraction: MapInteraction;
    infoCardOpen: boolean;
    infoCardElementStates: InfoCardElementStates;
    imageSmoothingEnabled: boolean;
    baseMapUrl: string;
    showRgbLayer: boolean;
}


export function newControlState(): ControlState {
    const branding = getBranding();
    const state: ControlState = {
        selectedDatasetId: 'local',
        selectedVariableName: 'conc_chl',
        selectedPlaceGroupIds: ['user'],
        selectedPlaceId: null,
        selectedUserPlaceId: null,
        selectedServerId: getDefaultApiServer().id,
        selectedTime: null,
        selectedTimeRange: null,
        timeSeriesUpdateMode: 'add',
        timeAnimationActive: false,
        timeAnimationInterval: 1000,
        timeChunkSize: 20,
        autoShowTimeSeries: true,
        showTimeSeriesPointsOnly: false,
        showTimeSeriesErrorBars: true,
        showTimeSeriesMedian: branding.defaultAgg === 'median',
        flyTo: null,
        activities: {},
        locale: 'en',
        dialogOpen: {},
        legalAgreementAccepted: false,
        mapInteraction: 'Point',
        showRgbLayer: false,
        infoCardOpen: false,
        infoCardElementStates: {
            dataset: {visible: true, viewMode: 'text'},
            variable: {visible: true, viewMode: 'text'},
            place: {visible: true, viewMode: 'text'},
        },
        imageSmoothingEnabled: false,
        baseMapUrl: branding.baseMapUrl || 'http://a.tile.osm.org/{z}/{x}/{y}.png',
    };
    return loadUserSettings(state);
}

// We cannot keep "MAP_OBJECTS" in control state object, because these objects are (1) not serializable
// and (2) logging actions will cause the browsers to crash

export const MAP_OBJECTS: { [id: string]: OlBaseObject } = {};
