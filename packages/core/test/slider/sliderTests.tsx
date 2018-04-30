/*
 * Copyright 2016 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the terms of the LICENSE file distributed with this project.
 */

import { assert } from "chai";
import { mount } from "enzyme";
import * as React from "react";
import * as sinon from "sinon";

import { expectPropValidationError } from "@blueprintjs/test-commons";

import * as Keys from "../../src/common/keys";
import { Handle } from "../../src/components/slider/handle";
import { Classes, Slider } from "../../src/index";
import * as Utils from "./sliderTestUtils";

describe("<Slider>", () => {
    let testsContainerElement: HTMLElement;

    beforeEach(() => {
        // need an element in the document for tickSize to be a real number
        testsContainerElement = document.createElement("div");
        document.body.appendChild(testsContainerElement);
    });

    afterEach(() => testsContainerElement.remove());

    it(`renders a .${Classes.SLIDER}`, () => {
        assert.lengthOf(renderSlider(<Slider className="foo" />).find(`.${Classes.SLIDER}.foo`), 1);
    });

    it("renders label for value and for each labelStepSize", () => {
        // [0  10  20  30  40  50]  +  value
        const wrapper = renderSlider(<Slider min={0} max={50} labelStepSize={10} />);
        assert.lengthOf(wrapper.find(`.${Classes.SLIDER}-label`), 7);
    });

    it("renders all labels even when floating point approx would cause the last one to be skipped", () => {
        // [0  0.14  0.28  0.42  0.56  0.70]  +  value
        const wrapper = renderSlider(<Slider min={0} max={0.7} labelStepSize={0.14} />);
        assert.lengthOf(wrapper.find(`.${Classes.SLIDER}-label`), 7);
    });

    it("renders result of labelRenderer() in each label", () => {
        const labelRenderer = (val: number) => val + "#";
        const wrapper = renderSlider(<Slider min={0} max={50} labelStepSize={10} labelRenderer={labelRenderer} />);
        assert.strictEqual(wrapper.find(`.${Classes.SLIDER}-axis`).text(), "0#10#20#30#40#50#");
    });

    it("default labelRenderer() fixes decimal places to labelPrecision", () => {
        const wrapper = renderSlider(<Slider labelPrecision={1} value={0.99 / 10} />);
        const labelText = wrapper.find(`.${Classes.SLIDER_HANDLE} .${Classes.SLIDER_LABEL}`).text();
        assert.strictEqual(labelText, "0.1");
    });

    it("infers precision of default labelRenderer from stepSize", () => {
        const wrapper = renderSlider(<Slider stepSize={0.01} />);
        assert.strictEqual(wrapper.state("labelPrecision"), 2);
    });

    it("labelRenderer={false} removes all labels", () => {
        const wrapper = renderSlider(<Slider labelRenderer={false} />);
        assert.lengthOf(wrapper.find(`.${Classes.SLIDER}-label`), 0);
    });

    it("moving mouse calls onChange with nearest value", () => {
        const changeSpy = sinon.spy();
        const slider = renderSlider(<Slider onChange={changeSpy} />).simulate("mousedown", { clientX: 0 });
        Utils.mouseMoveHorizontal(slider.state("tickSize"), 5);
        // called 4 times, for the move to 1, 2, 3, and 4
        assert.equal(changeSpy.callCount, 4, "call count");
        assert.deepEqual(changeSpy.args.map(arg => arg[0]), [1, 2, 3, 4]);
    });

    it("releasing mouse calls onRelease with nearest value", () => {
        const releaseSpy = sinon.spy();
        const slider = renderSlider(<Slider onRelease={releaseSpy} />).simulate("mousedown", { clientX: 0 });
        Utils.mouseMoveHorizontal(slider.state("tickSize"), 1);
        Utils.mouseUpHorizontal(slider.state("tickSize"));
        assert.isTrue(releaseSpy.calledOnce, "onRelease not called exactly once");
        assert.equal(releaseSpy.args[0][0], 1);
    });

    it("moving touch calls onChange with nearest value", () => {
        const changeSpy = sinon.spy();
        const slider = renderSlider(<Slider onChange={changeSpy} />).simulate("touchstart", {
            changedTouches: [{ clientX: 0 }],
        });
        Utils.touchMoveHorizontal(slider.state("tickSize"), 5);
        // called 4 times, for the move to 1, 2, 3, and 4
        assert.equal(changeSpy.callCount, 4);
        assert.deepEqual(changeSpy.args.map(arg => arg[0]), [1, 2, 3, 4]);
    });

    it("releasing touch calls onRelease with nearest value", () => {
        const releaseSpy = sinon.spy();
        const slider = renderSlider(<Slider onRelease={releaseSpy} />).simulate("touchstart", {
            changedTouches: [{ clientX: 0 }],
        });
        Utils.touchMoveHorizontal(slider.state("tickSize"), 1);
        Utils.touchEndHorizontal(slider.state("tickSize"));
        assert.isTrue(releaseSpy.calledOnce, "onRelease not called exactly once");
        assert.equal(releaseSpy.args[0][0], 1);
    });

    it("pressing arrow key down reduces value by stepSize", () => {
        const changeSpy = sinon.spy();
        renderSlider(<Slider value={3} onChange={changeSpy} />)
            .find(Handle)
            .simulate("keydown", { which: Keys.ARROW_DOWN });
        assert.isTrue(changeSpy.calledWith(2));
    });

    it("pressing arrow key up increases value by stepSize", () => {
        const changeSpy = sinon.spy();
        renderSlider(<Slider stepSize={4} value={3} onChange={changeSpy} />)
            .find(Handle)
            .simulate("keydown", { which: Keys.ARROW_UP });
        assert.isTrue(changeSpy.calledWith(7));
    });

    it("releasing arrow key calls onRelease with value", () => {
        const releaseSpy = sinon.spy();
        renderSlider(<Slider stepSize={4} value={3} onRelease={releaseSpy} />)
            .find(Handle)
            .simulate("keydown", { which: Keys.ARROW_UP })
            .simulate("keyup", { which: Keys.ARROW_UP });
        assert.isTrue(releaseSpy.calledWith(3));
    });

    it("disabled slider does not respond to mouse movement", () => {
        const changeSpy = sinon.spy();
        const slider = renderSlider(<Slider disabled={true} onChange={changeSpy} />).simulate("mousedown", {
            clientX: 0,
        });
        Utils.mouseMoveHorizontal(slider.state("tickSize"), 5);
        assert.isTrue(changeSpy.notCalled, "onChange was called when disabled");
    });

    it("disabled slider does not respond to touch movement", () => {
        const changeSpy = sinon.spy();
        const slider = renderSlider(<Slider disabled={true} onChange={changeSpy} />).simulate("touchstart", {
            changedTouches: [{ clientX: 0 }],
        });
        Utils.touchMoveHorizontal(slider.state("tickSize"), 5);
        assert.isTrue(changeSpy.notCalled, "onChange was called when disabled");
    });

    it("disabled slider does not respond to key presses", () => {
        const changeSpy = sinon.spy();
        renderSlider(<Slider disabled={true} onChange={changeSpy} />)
            .find(Handle)
            .simulate("keydown", { which: Keys.ARROW_DOWN });
        assert.isTrue(changeSpy.notCalled, "onChange was called when disabled");
    });

    it("disabled slider does not respond to track clicks", () => {
        const trackSelector = `.${Classes.SLIDER}-track`;
        const slider = renderSlider(<Slider disabled={true} />);
        // spy on instance method instead of onChange because we can't supply nativeEvent
        const trackClickSpy = sinon.spy(slider.instance() as any, "handleTrackClick");
        slider
            .find(trackSelector)
            .simulate("mousedown", { target: testsContainerElement.querySelector(trackSelector) });
        assert.isTrue(trackClickSpy.notCalled, "handleTrackClick was called when disabled");
    });

    it("disabled slider does not respond to track taps", () => {
        const trackSelector = `.${Classes.SLIDER}-track`;
        const slider = renderSlider(<Slider disabled={true} />);
        // spy on instance method instead of onChange because we can't supply nativeEvent
        const trackClickSpy = sinon.spy(slider.instance() as any, "handleTrackTouch");
        slider
            .find(trackSelector)
            .simulate("touchstart", { target: testsContainerElement.querySelector(trackSelector) });
        assert.isTrue(trackClickSpy.notCalled, "handleTrackTouch was called when disabled");
    });

    it("throws error if stepSize <= 0", () => {
        [{ stepSize: 0 }, { stepSize: -10 }].forEach((props: any) => {
            expectPropValidationError(Slider, props, "greater than zero");
        });
    });

    it("throws error if labelStepSize <= 0", () => {
        [{ labelStepSize: 0 }, { labelStepSize: -10 }].forEach((props: any) => {
            expectPropValidationError(Slider, props, "greater than zero");
        });
    });

    it("fill does not exceed bounds if initialValue outside bounds of min/max", () => {
        const style = renderSlider(<Slider initialValue={-10} min={0} value={5} />)
            .find("." + Classes.SLIDER_PROGRESS)
            .prop("style") as React.CSSProperties;
        assert.strictEqual(style.left, "0.00%");
    });

    describe("vertical orientation", () => {
        const changeSpy = sinon.spy();
        const releaseSpy = sinon.spy();

        afterEach(() => {
            changeSpy.resetHistory();
            releaseSpy.resetHistory();
        });

        it("moving mouse calls onChange with nearest value", () => {
            const slider = renderSlider(<Slider vertical={true} onChange={changeSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("mousedown", { clientY: sliderBottom });
            Utils.mouseMoveVertical(slider.state("tickSize"), 5, 0, sliderBottom);

            // called 4 times, for the move to 1, 2, 3, and 4
            assert.equal(changeSpy.callCount, 4);
            assert.deepEqual(changeSpy.args.map(arg => arg[0]), [1, 2, 3, 4]);
        });

        it("releasing mouse calls onRelease with nearest value", () => {
            const slider = renderSlider(<Slider vertical={true} onRelease={releaseSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("mousedown", { clientY: sliderBottom });
            Utils.mouseUpVertical(sliderBottom - slider.state("tickSize"));

            assert.isTrue(releaseSpy.calledOnce, "onRelease not called exactly once");
            assert.equal(releaseSpy.args[0][0], 1);
        });

        it("moving touch calls onChange with nearest value", () => {
            const slider = renderSlider(<Slider vertical={true} onChange={changeSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("touchstart", { changedTouches: [{ clientY: sliderBottom }] });
            Utils.touchMoveVertical(slider.state("tickSize"), 5, 0, sliderBottom);

            // called 4 times, for the move to 1, 2, 3, and 4
            assert.equal(changeSpy.callCount, 4);
            assert.deepEqual(changeSpy.args.map(arg => arg[0]), [1, 2, 3, 4]);
        });

        it("releasing touch calls onRelease with nearest value", () => {
            const slider = renderSlider(<Slider vertical={true} onRelease={releaseSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("touchstart", { changedTouches: [{ clientY: sliderBottom }] });
            Utils.touchMoveVertical(slider.state("tickSize"), 1, 0, sliderBottom);
            Utils.touchEndVertical(sliderBottom - slider.state("tickSize"));

            assert.isTrue(releaseSpy.calledOnce, "onRelease not called exactly once");
            assert.equal(releaseSpy.args[0][0], 1);
        });

        it("disabled slider does not respond to mouse movement", () => {
            const slider = renderSlider(<Slider vertical={true} disabled={true} onChange={changeSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("mousedown", { clientY: sliderBottom });
            Utils.mouseMoveVertical(slider.state("tickSize"), 5, 0, sliderBottom);

            assert.isTrue(changeSpy.notCalled, "onChange was called when disabled");
        });

        it("disabled slider does not respond to touch movement", () => {
            const slider = renderSlider(<Slider vertical={true} disabled={true} onChange={changeSpy} />);
            const sliderBottom = Utils.getSliderBottomPixel(slider);

            slider.simulate("touchstart", { changedTouches: [{ clientY: sliderBottom }] });
            Utils.touchMoveVertical(slider.state("tickSize"), 5, 0, sliderBottom);

            assert.isTrue(changeSpy.notCalled, "onChange was called when disabled");
        });
    });

    function renderSlider(slider: JSX.Element) {
        return mount(slider, { attachTo: testsContainerElement });
    }
});
