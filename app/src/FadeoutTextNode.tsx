import React from 'react'

type FadeoutTextNodeProps = {
    data: {
        text: string
    }
}
export const FadeoutTextNode: React.FC<FadeoutTextNodeProps> = (props) => {
    console.log(props.data.text)
    return (
        <div style={{border: '1px solid skyblue', padding: '10px', maxWidth: '250px', maxHeight: '140px'}}>
            {props.data.text}
        </div>
    )
}