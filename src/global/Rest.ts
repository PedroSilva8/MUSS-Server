import { Response } from 'express'

export default class rest {

    static Send = (res: Response, code: number, message: any) => {
        res.status(code).send(message);
    }

    static SendSuccess = (res: Response, message: any) => {
        rest.Send(res, 200, message);
    }

    static SendErrorBadRequest = (res: Response, message: any) => {
        rest.Send(res, 400, message);
    }

    static SendErrorForbidden = (res: Response, message: any) => {
        rest.Send(res, 403, message);
    }

    static SendErrorNotFound = (res: Response, message: any) => {
        rest.Send(res, 404, message);
    }

    static SendErrorConflict = (res: Response, message: any) => {
        rest.Send(res, 409, message);
    }

    static SendErrorInternalServer = (res: Response, message: any) => {
        rest.Send(res, 500, message);
    }
}