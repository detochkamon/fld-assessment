import React, { Component } from 'react';
import ParticleImage1 from './particle.png';
import ParticleImage2 from './gravity.png';
import LegacyAnimation from './legacy';



class WelcomeAnimation extends Component {
    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
    }
    componentDidMount() {
        LegacyAnimation.start(ParticleImage1, ParticleImage2, this.canvasRef.current, this.props.text);
    }
    render() {
        return (
            <div>
                <canvas width="800" height="600" ref={this.canvasRef}></canvas>
            </div>
        );
    }
}
export default WelcomeAnimation;