import * as React from 'react';
import ReactSelect from 'react-select';

const options = [
    { value: 'chocolate', label: 'Chocolate' },
    { value: 'strawberry', label: 'Strawberry' },
    { value: 'vanilla', label: 'Vanilla' },
];

export default function Select(props) {
    const [selectedOption, setSelectedOption] = React.useState(null);

    const handleChange = selectedOption => {
        setSelectedOption(selectedOption);
        console.log(`Option selected:`, selectedOption);
    };
    const { selectedOption } = this.state;

    return (
        <ReactSelect
            value={selectedOption}
            onChange={handleChange}
            options={options}
        />
    );
};
