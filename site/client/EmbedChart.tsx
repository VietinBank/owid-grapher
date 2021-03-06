import * as React from "react"
import { observer } from "mobx-react"
import { readConfigFromHTML } from "site/client/figures/ChartFigure"
import {
    computed,
    observable,
    runInAction,
    autorun,
    IReactionDisposer
} from "mobx"
import { ChartConfig } from "charts/ChartConfig"
import { ChartFigureView } from "./ChartFigureView"
import { splitURLintoPathAndQueryString } from "utils/client/url"

@observer
export class EmbedChart extends React.Component<{ src: string }> {
    @computed get configUrl(): string {
        return splitURLintoPathAndQueryString(this.props.src).path
    }
    @computed get queryStr(): string | undefined {
        return splitURLintoPathAndQueryString(this.props.src).queryString
    }
    @observable chart?: ChartConfig

    async loadConfig() {
        const { configUrl } = this
        const resp = await fetch(configUrl)
        if (this.configUrl !== configUrl) {
            // Changed while we were fetching
            return
        }

        const html = await resp.text()
        const config = readConfigFromHTML(html)
        runInAction(() => {
            this.chart = new ChartConfig(config, {
                isEmbed: true,
                queryStr: this.queryStr
            })
        })
    }

    dispose?: IReactionDisposer
    componentDidMount() {
        this.dispose = autorun(() => this.props.src && this.loadConfig())
    }

    componentWillUnmount() {
        if (this.dispose) this.dispose()
    }

    render() {
        return this.chart ? (
            <ChartFigureView chart={this.chart} />
        ) : (
            <figure data-grapher-src={this.props.src} />
        )
    }
}
