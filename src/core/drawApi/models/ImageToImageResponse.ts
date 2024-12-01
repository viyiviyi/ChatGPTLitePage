/* tslint:disable */
/* eslint-disable */
/**
 * sdapiv1
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 1.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
/**
 * ImageToImageResponse
 * @export
 * @interface ImageToImageResponse
 */
export interface ImageToImageResponse {
    /**
     * Image，The generated image in base64 format.
     * @type {Array<string>}
     * @memberof ImageToImageResponse
     */
    images?: Array<string>;
    /**
     * Parameters
     * @type {object}
     * @memberof ImageToImageResponse
     */
    parameters: object;
    /**
     * Info
     * @type {string}
     * @memberof ImageToImageResponse
     */
    info: string;
}

export function ImageToImageResponseFromJSON(json: any): ImageToImageResponse {
    return ImageToImageResponseFromJSONTyped(json, false);
}

export function ImageToImageResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImageToImageResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'images': !exists(json, 'images') ? undefined : json['images'],
        'parameters': json['parameters'],
        'info': json['info'],
    };
}

export function ImageToImageResponseToJSON(value?: ImageToImageResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'images': value.images,
        'parameters': value.parameters,
        'info': value.info,
    };
}

