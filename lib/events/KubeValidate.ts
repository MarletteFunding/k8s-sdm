import {
    EventFired,
    EventHandler, Failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult, reduceResults, Success,
    Tags,
    Value,
} from "@atomist/automation-client";
import {fetchCommitForSdmGoal, SdmGoalEvent} from "@atomist/sdm";
import * as k8 from "kubernetes-client";
import {getKubeConfig, KubeDeploymentRequest, validateApplication} from "../k8";
import {SdmGoalSub} from "../typings/types";
import {CommitForSdmGoal} from "./KubeDeploy";

@EventHandler("get status of k8 cluster", GraphQL.subscription("SdmGoalSub"))
@Tags("validate", "kubernetes")
export class KubeValidate implements HandleEvent<SdmGoalSub.Subscription> {
    @Value({
        path: "kubernetes.name",
        required: true,
    })
    public name: string;

    @Value({
        path: "kubernetes.namespace",
        required: false,
    })
    public ns: string;

    public handle(ev: EventFired<SdmGoalSub.Subscription>, ctx: HandlerContext): Promise<HandlerResult> {
        let k8Config: k8.ClusterConfiguration | k8.ClientConfiguration;
        try {
            k8Config = getKubeConfig();
        } catch (e) {
            return ctx.messageClient.respond(e.message)
                .then(() => ({code: Failure.code, message: e.message}), err => {
                    const msg = `Failed to send response message: ${err.message}`;
                    return {code: Failure.code, message: `${e.message}; ${msg}`};
                });
        }

        const req: KubeDeploymentRequest = {
            config: k8Config,
            name: this.name,
            ns: this.ns,
        };

        return Promise.all(ev.data.SdmGoal.map(g => {
            const sdmGoal = g as SdmGoalEvent;
            return fetchCommitForSdmGoal(ctx, sdmGoal)
                .then((commit: CommitForSdmGoal) => {
                    return validateApplication(req, commit.image.imageName)
                        .then(() =>
                            ctx.messageClient.respond("validated")
                                .then(() =>
                                    Success));
                });
        }))
            .then(results => reduceResults(results));

    }
}
